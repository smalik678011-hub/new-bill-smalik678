import React from 'react';
import { Phone, MapPin, Globe, CreditCard, Sparkles, Shield, User, Star } from 'lucide-react';



export interface CardData {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  tagline: string;
  specialties: string[];
  upiId: string;
  email?: string;
  website?: string;
}

interface TemplateProps {
  data: CardData;
  size: 'whatsapp' | 'instagram' | 'facebook';
  showWatermark: boolean;
}

// 1. Bold Template (dark + orange)
export function BoldTemplate({ data, size, showWatermark }: TemplateProps) {

  const containerClass = "bg-gray-950 text-white relative w-full h-full flex flex-col justify-between font-sans overflow-hidden p-[6%]";
  const accentText = "text-orange-500";
  const accentBg = "bg-orange-500 text-black";
  const borderHighlight = "border-orange-500/30";

  if (size === 'facebook') {
    // Horizontal wide banner
    return (
      <div className={containerClass}>
        {/* Background Decors */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-0.5 h-full bg-orange-500/5" />
        
        <div className="flex justify-between items-stretch h-full z-10">
          <div className="w-[60%] flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-orange-500 font-bold block">VERIFIED BUSINESS</span>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-tight select-all">{data.businessName}</h1>
              <p className="text-xs text-gray-400 mt-1 italic font-medium">"{data.tagline}"</p>
            </div>
            
            <div className="space-y-1.5 mt-2">
              <span className="text-[9px] uppercase tracking-wider text-orange-500/70 font-bold block">OUR EXPERTISE</span>
              <div className="flex flex-wrap gap-1.5">
                {data.specialties.map((s, idx) => (
                  <span key={idx} className="bg-gray-900 border border-gray-800 text-[10px] px-2.5 py-1 rounded-lg text-gray-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[35%] flex flex-col justify-between items-end text-right border-l border-gray-800 pl-4">
            <div className="space-y-1">
              <span className="bg-orange-500 text-black text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                PROPRIETOR
              </span>
              <h2 className="text-sm font-bold mt-1 text-white">{data.ownerName}</h2>
              <div className="flex items-center justify-end text-xs text-gray-300 font-bold mt-1">
                <Phone className="h-3.5 w-3.5 mr-1 text-orange-500" />
                <span>{data.phone}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 flex items-center justify-end">
                <MapPin className="h-3 w-3 mr-1 text-orange-500 shrink-0" />
                <span className="truncate max-w-[180px]">{data.address}</span>
              </p>
              {data.upiId && (
                <p className="text-[9px] text-gray-500 font-mono">UPI ID: {data.upiId}</p>
              )}
            </div>
          </div>
        </div>

        {showWatermark && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-650 font-mono tracking-widest uppercase opacity-60">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  if (size === 'instagram') {
    // Square layout
    return (
      <div className={containerClass}>
        {/* Visual elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />

        <div className="flex justify-between items-start z-10 border-b border-gray-900 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-orange-500 font-black">PREMIUM CARD</span>
            <h1 className="text-2xl font-black uppercase tracking-tight mt-1">{data.businessName}</h1>
            <p className="text-xs text-gray-400 italic mt-0.5">"{data.tagline}"</p>
          </div>
          <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center justify-center text-orange-500 font-black">
            {data.businessName.substring(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="my-[8%] space-y-3 z-10">
          <span className="text-[10px] uppercase tracking-widest text-orange-500/70 font-bold block">SPECIALIZATION & SERVICES</span>
          <div className="grid grid-cols-1 gap-2">
            {data.specialties.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 bg-gray-900 border border-gray-850 p-2.5 rounded-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-xs text-gray-100 font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-950 pt-4 flex justify-between items-end z-10 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-[9px] text-orange-500 font-bold block uppercase tracking-wider">CONTACT PERSON</span>
            <span className="text-sm font-bold text-white block">{data.ownerName}</span>
            <span className="flex items-center text-xs text-gray-300 font-bold mt-1">
              <Phone className="h-3 w-3 mr-1 text-orange-500" />
              {data.phone}
            </span>
          </div>

          <div className="text-right space-y-1 max-w-[140px]">
            <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">ADDRESS / CORNER</span>
            <span className="text-[10px] text-gray-300 break-words block">{data.address}</span>
            {data.upiId && <span className="text-[8.5px] text-gray-500 block">UPI: {data.upiId}</span>}
          </div>
        </div>

        {showWatermark && (
          <div className="text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest mt-4">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  // WhatsApp portrait (9:16 aspect core)
  return (
    <div className={containerClass}>
      <div className="absolute top-10 right-0 w-44 h-44 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-36 h-36 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="text-center py-6 border-b border-gray-900 z-10">
        <span className="text-[10px] uppercase tracking-[0.25em] text-orange-500 font-black block">PROFESSIONAL DIRECTORY</span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mt-2 leading-tight">{data.businessName}</h1>
        <p className="text-xs text-gray-400 italic mt-1.5">"{data.tagline}"</p>
      </div>

      <div className="flex-1 my-[15%] flex flex-col justify-center space-y-6 z-10">
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-orange-500/70 font-semibold inline-block border-b border-orange-500/30 pb-1">हमारे यहाँ उपलब्ध उत्कृष्ट विशिष्टताएँ</span>
        </div>

        <div className="space-y-3.5">
          {data.specialties.map((s, idx) => (
            <div key={idx} className="bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-850 p-4 rounded-2xl flex items-center space-x-3 shadow-lg">
              <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs font-black">
                {idx + 1}
              </div>
              <span className="text-xs text-gray-100 font-semibold">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-6 z-10 border-t border-gray-900 pt-6">
        <div className="bg-gray-900/60 border border-gray-850 rounded-2xl p-4 text-center space-y-2.5">
          <span className="bg-orange-500 text-black px-3.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">Mera Swasthya & Sampark</span>
          <h2 className="text-base font-extrabold text-white">{data.ownerName}</h2>
          
          <div className="flex justify-center items-center space-x-1.5 text-xs text-orange-500 font-mono font-black py-1">
            <Phone className="h-4 w-4" />
            <span className="text-sm tracking-wider">{data.phone}</span>
          </div>

          <p className="text-xs text-gray-400 mt-1 flex items-center justify-center px-4 leading-relaxed">
            <MapPin className="h-3.5 w-3.5 mr-1 text-orange-500 shrink-0" />
            <span>{data.address}</span>
          </p>
        </div>

        {data.upiId && (
          <div className="text-center font-mono text-[10px] text-gray-550">
            UPI Accepted • <span className="text-emerald-500 font-bold">{data.upiId}</span>
          </div>
        )}

        {showWatermark && (
          <div className="text-center text-[10px] text-gray-650 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Minimal Template (white + black)
export function MinimalTemplate({ data, size, showWatermark }: TemplateProps) {

  const containerClass = "bg-white text-black relative w-full h-full flex flex-col justify-between font-sans overflow-hidden p-[6%] border border-gray-200/40";

  if (size === 'facebook') {
    return (
      <div className={containerClass}>
        <div className="flex justify-between items-stretch h-full z-10">
          <div className="w-[60%] flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-black select-all">{data.businessName}</h1>
              <p className="text-xs text-gray-500 mt-0.5 tracking-tight">"{data.tagline}"</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">SERVICES</span>
              <div className="flex flex-wrap gap-1">
                {data.specialties.map((s, idx) => (
                  <span key={idx} className="border border-black text-[9px] font-medium font-mono px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[35%] flex flex-col justify-between items-end text-right border-l border-gray-100 pl-4 font-mono">
            <div>
              <span className="text-[9px] text-gray-400 font-black block uppercase tracking-widest">OWNER</span>
              <h2 className="text-xs font-black uppercase text-black">{data.ownerName}</h2>
              <p className="text-xs text-black font-extrabold mt-1 flex items-center justify-end">
                <Phone className="h-3 w-3 mr-1 text-black shrink-0" />
                {data.phone}
              </p>
            </div>

            <div className="text-[10px] text-gray-500 space-y-1 leading-tight">
              <p className="truncate max-w-[170px]">{data.address}</p>
              {data.upiId && <p className="text-[8px] opacity-70">UPI: {data.upiId}</p>}
            </div>
          </div>
        </div>

        {showWatermark && (
          <div className="absolute bottom-1 left-2 text-[8px] text-gray-450 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  if (size === 'instagram') {
    return (
      <div className={containerClass}>
        <div className="border border-black p-5 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest leading-none text-black">{data.businessName}</h1>
              <p className="text-[11px] text-gray-500 mt-2 font-medium">"{data.tagline}"</p>
            </div>
            <div className="h-8 w-8 border border-black flex items-center justify-center font-bold text-xs shrink-0 bg-black text-white">
              M
            </div>
          </div>

          <div className="my-[5%]">
            <span className="text-[8.5px] font-bold tracking-widest text-gray-400 uppercase block mb-2">SERVICES & SPECIALTIES</span>
            <div className="space-y-1.5">
              {data.specialties.map((s, idx) => (
                <div key={idx} className="text-xs text-gray-900 flex items-center space-x-2 font-medium">
                  <span className="font-mono text-[9px] font-bold text-gray-400">[0{idx+1}]</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-end font-mono">
            <div className="space-y-1">
              <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black block">PROPRIETOR</span>
              <span className="text-xs text-black font-black block">{data.ownerName}</span>
              <span className="text-xs font-bold text-black flex items-center">
                <Phone className="h-3 w-3 mr-1 text-black" />
                {data.phone}
              </span>
            </div>

            <div className="text-right text-[9px] text-gray-500 max-w-[150px]">
              <span className="block text-[8px] tracking-widest font-black uppercase">STUDIO</span>
              <span>{data.address}</span>
            </div>
          </div>

          {showWatermark && (
            <div className="text-center text-[8.5px] text-gray-400 font-mono uppercase tracking-widest mt-2">
              ⚡ Made with BillKaro
            </div>
          )}
        </div>
      </div>
    );
  }

  // WhatsApp portrait
  return (
    <div className={containerClass}>
      <div className="border-2 border-black p-8 h-full flex flex-col justify-between relative">
        <div className="text-center py-4">
          <span className="text-[9px] text-gray-400 font-mono tracking-[0.3em] font-black uppercase">MINIMAL DESIGN HOUSE</span>
          <h1 className="text-2xl font-black uppercase tracking-widest text-black mt-2 leading-snug">{data.businessName}</h1>
          <p className="text-[11px] text-gray-500 mt-2 italic">"{data.tagline}"</p>
        </div>

        <div className="my-8 flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center border-b border-gray-100 pb-2">
            <span className="text-[9px] font-mono font-bold text-gray-450 uppercase tracking-widest block">CORE EXPERTISE REGISTER</span>
          </div>

          <div className="space-y-3 font-mono">
            {data.specialties.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-gray-100/60 font-medium">
                <span className="text-gray-500">0{idx + 1}.</span>
                <span className="text-black font-black uppercase text-right tracking-tight">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center py-4 border-t border-black space-y-2 font-mono">
            <span className="text-[8.5px] text-gray-400 uppercase tracking-widest block font-black">LEAD DIRECTORY</span>
            <h2 className="text-sm font-black text-black uppercase">{data.ownerName}</h2>
            <div className="flex justify-center text-xs text-black font-extrabold tracking-widest mt-1">
              <Phone className="h-3.5 w-3.5 mr-1" />
              <span>{data.phone}</span>
            </div>
            
            <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-tight">
              {data.address}
            </p>
          </div>

          {data.upiId && (
            <div className="text-center font-mono text-[9px] text-gray-400 border border-gray-100/80 rounded py-1">
              BHIM UPI Accepted: <span className="font-extrabold text-black">{data.upiId}</span>
            </div>
          )}

          {showWatermark && (
            <div className="text-center text-[9px] text-gray-400 font-mono tracking-wider uppercase">
              ⚡ Made with BillKaro
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Classic Template (navy + gold)
export function ClassicTemplate({ data, size, showWatermark }: TemplateProps) {

  const containerClass = "bg-[#0b1b3d] text-[#e5c158] relative w-full h-full flex flex-col justify-between font-serif overflow-hidden p-[6%] border border-[#e5c158]/20";

  if (size === 'facebook') {
    return (
      <div className={containerClass}>
        {/* Fine gold borders */}
        <div className="absolute inset-2 border border-[#e5c158]/30 pointer-events-none" />
        
        <div className="flex justify-between items-stretch h-full z-10 p-2">
          <div className="w-[60%] flex flex-col justify-between">
            <div>
              <span className="text-[8px] uppercase tracking-[0.2em] text-[#d6b758] block">ESTABLISHED BUSINESS</span>
              <h1 className="text-xl font-bold tracking-wide leading-tight text-white select-all">{data.businessName}</h1>
              <p className="text-[10px] text-gray-250 italic">"{data.tagline}"</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-[#d6b758]/80 block">PREMIUM SERVICES</span>
              <div className="flex flex-wrap gap-1">
                {data.specialties.map((s, idx) => (
                  <span key={idx} className="bg-white/5 border border-[#e5c158]/20 text-[9px] text-[#e2be52] px-2 py-0.5 rounded">
                    ❊ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[35%] flex flex-col justify-between items-end text-right border-l border-[#e5c158]/20 pl-4">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-[#d6b758] block">PROPRIETOR</span>
              <h2 className="text-xs font-bold text-white mt-0.5">{data.ownerName}</h2>
              <div className="flex items-center justify-end text-xs font-bold mt-1 text-white">
                <Phone className="h-3 w-3 mr-1 text-[#e5c158]" />
                {data.phone}
              </div>
            </div>

            <div className="text-[9px] text-gray-300 leading-tight">
              <p className="truncate max-w-[175px]">{data.address}</p>
              {data.upiId && <p className="text-[8px] text-[#d6b758]/80 font-mono">UPI: {data.upiId}</p>}
            </div>
          </div>
        </div>

        {showWatermark && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[8px] text-[#e5c158]/40 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  if (size === 'instagram') {
    return (
      <div className={containerClass}>
        <div className="absolute inset-3 border-2 border-[#e5c158]/40 pointer-events-none" />
        <div className="absolute inset-4 border border-[#e5c158]/10 pointer-events-none" />

        <div className="p-4 flex flex-col justify-between h-full z-10">
          <div className="text-center pt-2 border-b border-[#e5c158]/20 pb-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#e5c158] block font-mono">REGAL QUALITY</span>
            <h1 className="text-xl font-bold tracking-wide mt-1 text-white leading-tight">{data.businessName}</h1>
            <p className="text-xs text-slate-300 italic mt-0.5">"{data.tagline}"</p>
          </div>

          <div className="my-[4%] space-y-2">
            <span className="text-[8px] tracking-widest uppercase text-[#e5c158]/70 font-mono block text-center">SERVICES EXCELLENCE</span>
            <div className="grid grid-cols-1 gap-1.5 px-4">
              {data.specialties.map((s, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs text-[#e5c158]/90 font-medium">
                  <span className="text-[10px]">❈</span>
                  <span className="text-white truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#e5c158]/20 pt-4 flex justify-between items-end text-slate-300 antialiased font-serif">
            <div className="space-y-1">
              <span className="text-[8px] tracking-widest text-[#d6b758] block">DIRECTOR</span>
              <span className="text-xs font-bold text-white block">{data.ownerName}</span>
              <span className="text-xs font-bold text-[#e5c158] flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {data.phone}
              </span>
            </div>

            <div className="text-right text-[9px] max-w-[140px] leading-tight text-slate-300">
              <span className="block text-[8px] text-[#d6b758] tracking-widest">OFFICE</span>
              <span>{data.address}</span>
            </div>
          </div>

          {showWatermark && (
            <div className="text-center text-[8.5px] text-[#e5c158]/50 font-mono uppercase tracking-widest mt-2">
              ⚡ Made with BillKaro
            </div>
          )}
        </div>
      </div>
    );
  }

  // WhatsApp portrait
  return (
    <div className={containerClass}>
      <div className="absolute inset-4 border-2 border-[#e5c158]/35 pointer-events-none" />
      <div className="absolute inset-6 border border-[#e5c158]/15 pointer-events-none" />
      
      <div className="p-6 flex flex-col justify-between h-full z-10 text-center">
        <div className="py-6 border-b border-[#e5c158]/20">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#e5c158] font-bold block">ROYAL MERCHANDISING</span>
          <h1 className="text-2xl font-black tracking-wide text-white mt-1.5 leading-snug">{data.businessName}</h1>
          <p className="text-xs text-white/70 italic mt-2">"{data.tagline}"</p>
        </div>

        <div className="flex-1 my-8 flex flex-col justify-center space-y-4">
          <span className="text-[9px] uppercase tracking-widest text-[#e5c158]/60 font-mono">SIGNATURE PORTFOLIO</span>
          <div className="space-y-3 px-2">
            {data.specialties.map((s, idx) => (
              <div key={idx} className="bg-white/5 border border-[#e5c158]/20 p-3 rounded-xl flex items-center space-x-3.5 shadow-md">
                <span className="text-sm font-serif italic text-[#e5c158]">✦</span>
                <span className="text-xs font-bold text-[#faf0d0] tracking-tight">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-[#e5c158]/20">
          <div className="space-y-2">
            <span className="text-[8px] text-[#e5c158]/80 uppercase tracking-widest block font-bold font-mono">CONTACT INFORMATION</span>
            <h2 className="text-sm font-bold text-white uppercase">{data.ownerName}</h2>
            <div className="flex justify-center text-xs text-[#e5c158] font-bold mt-1">
              <Phone className="h-3.5 w-3.5 mr-1" />
              <span>{data.phone}</span>
            </div>
            <p className="text-xs text-[#faf0d0]/80 mt-1 max-w-[220px] mx-auto leading-relaxed">
              {data.address}
            </p>
          </div>

          {data.upiId && (
            <div className="text-center font-mono text-[9px] text-[#e5c158]/80 border border-[#e5c158]/20 rounded py-1 max-w-[200px] mx-auto">
              UPI Accepted: <span className="text-white font-extrabold">{data.upiId}</span>
            </div>
          )}

          {showWatermark && (
            <div className="text-center text-[10px] text-[#e5c158]/40 font-mono tracking-widest uppercase">
              ⚡ Made with BillKaro
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. Colorful Template (gradient)
export function ColorfulTemplate({ data, size, showWatermark }: TemplateProps) {

  const containerClass = "bg-gradient-to-tr from-purple-800 via-rose-700 to-amber-500 text-white relative w-full h-full flex flex-col justify-between font-sans overflow-hidden p-[6%]";

  if (size === 'facebook') {
    return (
      <div className={containerClass}>
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
        
        <div className="flex justify-between items-stretch h-full z-10">
          <div className="w-[60%] flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block">LIVE STUDIO</span>
              <h1 className="text-2xl font-black uppercase tracking-tight mt-1 select-all">{data.businessName}</h1>
              <p className="text-xs text-white/90 font-medium">"{data.tagline}"</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8.5px] uppercase tracking-wider text-rose-200 block">OUR VERTICALS</span>
              <div className="flex flex-wrap gap-1">
                {data.specialties.map((s, idx) => (
                  <span key={idx} className="bg-black/20 border border-white/10 text-[9px] text-white px-2 py-0.5 rounded-full font-bold">
                    🌈 {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[35%] flex flex-col justify-between items-end text-right border-l border-white/20 pl-4">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-rose-200 block">FOUNDER</span>
              <h2 className="text-xs font-black uppercase text-white mt-0.5">{data.ownerName}</h2>
              <div className="flex items-center justify-end text-xs font-bold mt-1 text-white">
                <Phone className="h-3 w-3 mr-1 text-white" />
                {data.phone}
              </div>
            </div>

            <div className="text-[9.5px] text-rose-100 leading-tight">
              <p className="truncate max-w-[175px]">{data.address}</p>
              {data.upiId && <p className="text-[8px] text-rose-200 font-mono">UPI: {data.upiId}</p>}
            </div>
          </div>
        </div>

        {showWatermark && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[9px] text-white/60 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  if (size === 'instagram') {
    return (
      <div className={containerClass}>
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-400 blur-2xl opacity-40 rounded-full" />

        <div className="flex justify-between items-start z-10 border-b border-white/20 pb-4">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-yellow-300 font-black">CREATIVE BOUTIQUE</span>
            <h1 className="text-xl font-black uppercase tracking-tight mt-1">{data.businessName}</h1>
            <p className="text-xs text-white/80 italic mt-0.5">"{data.tagline}"</p>
          </div>
          <div className="h-10 w-10 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center font-black">
            {data.businessName.substring(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="my-[4%] space-y-2 z-10">
          <span className="text-[9px] uppercase tracking-widest text-rose-200 block font-bold text-center">SPECIAL SERVICES SETUP</span>
          <div className="grid grid-cols-1 gap-1.5 px-2">
            {data.specialties.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 bg-white/10 border border-white/20 p-2 rounded-xl">
                <span className="text-[10px]">✨</span>
                <span className="text-xs text-white font-extrabold">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/20 pt-4 flex justify-between items-end z-10 font-mono text-white">
          <div className="space-y-1">
            <span className="text-[8px] text-yellow-300 uppercase tracking-widest font-bold block">KEY PERSON</span>
            <span className="text-xs font-bold text-white block">{data.ownerName}</span>
            <span className="text-xs mt-1 text-white bg-black/20 px-2 py-0.5 rounded-full inline-flex items-center">
              <Phone className="h-3 w-3 mr-1 text-yellow-300" />
              {data.phone}
            </span>
          </div>

          <div className="text-right text-[10px] text-rose-100 max-w-[140px]">
            <span className="block text-[8px] tracking-widest font-black uppercase">BOUTIQUE</span>
            <span>{data.address}</span>
          </div>
        </div>

        {showWatermark && (
          <div className="text-center text-[9px] text-white/60 font-mono uppercase tracking-widest mt-2">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  // WhatsApp portrait
  return (
    <div className={containerClass}>
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-48 h-48 bg-yellow-400 blur-3xl opacity-30 rounded-full" />
      
      <div className="text-center py-6 border-b border-white/20 z-10">
        <span className="text-[10px] bg-white/20 text-white px-3.5 py-0.5 rounded-full tracking-[0.25em] text-[8px] uppercase font-bold inline-block">DESIGN MULTIVERSE</span>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-4">{data.businessName}</h1>
        <p className="text-xs text-white/95 italic mt-2">"{data.tagline}"</p>
      </div>

      <div className="flex-1 my-8 flex flex-col justify-center space-y-4 z-10">
        <span className="text-[9px] uppercase tracking-widest text-rose-200 text-center block">GALLERY SPECIALTIES</span>
        <div className="space-y-3">
          {data.specialties.map((s, idx) => (
            <div key={idx} className="bg-white/15 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl flex items-center space-x-3.5 shadow-lg">
              <span className="text-[12px]">💖</span>
              <span className="text-xs font-bold text-white tracking-tight">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-white/20 z-10">
        <div className="bg-black/20 border border-white/10 rounded-2xl p-4 text-center space-y-2">
          <span className="text-[9px] text-yellow-300 uppercase tracking-widest block font-bold font-mono">REPRESENTATIVE</span>
          <h2 className="text-sm font-black text-white uppercase">{data.ownerName}</h2>
          <div className="flex justify-center text-xs text-white bg-white/10 py-1 rounded-xl max-w-[170px] mx-auto font-mono font-bold mt-1">
            <Phone className="h-3.5 w-3.5 mr-1 text-yellow-300" />
            <span>{data.phone}</span>
          </div>
          <p className="text-xs text-rose-100 mt-1.5 max-w-[210px] mx-auto leading-relaxed">
            {data.address}
          </p>
        </div>

        {data.upiId && (
          <div className="text-center font-mono text-[9px] text-white bg-black/10 py-1 rounded max-w-[200px] mx-auto border border-white/5">
            UPI ID: <span className="font-extrabold text-yellow-300">{data.upiId}</span>
          </div>
        )}

        {showWatermark && (
          <div className="text-center text-[10px] text-white/60 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    </div>
  );
}

// 5. Professional Template (grey + blue)
export function ProfessionalTemplate({ data, size, showWatermark }: TemplateProps) {

  const containerClass = "bg-slate-900 text-slate-100 relative w-full h-full flex flex-col justify-between font-sans overflow-hidden p-[6%] border border-blue-500/20";

  if (size === 'facebook') {
    return (
      <div className={containerClass}>
        <div className="absolute left-0 bottom-0 w-1/4 h-full bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-stretch h-full z-10">
          <div className="w-[60%] flex flex-col justify-between">
            <div>
              <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-block">OFFICIAL WORKSPACE</span>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white select-all">{data.businessName}</h1>
              <p className="text-xs text-slate-400">"{data.tagline}"</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-blue-400 font-bold block">SERVICES CATALOGUE</span>
              <div className="flex flex-wrap gap-1">
                {data.specialties.map((s, idx) => (
                  <span key={idx} className="bg-slate-800 border border-slate-700 text-[9px] text-blue-300 px-2 py-0.5 rounded">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[35%] flex flex-col justify-between items-end text-right border-l border-slate-800 pl-4 font-mono">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-blue-400 block">MANAGING DIRECTOR</span>
              <h2 className="text-xs font-bold text-white mt-0.5">{data.ownerName}</h2>
              <div className="flex items-center justify-end text-xs font-bold mt-1 text-white">
                <Phone className="h-3 w-3 mr-1 text-blue-400" />
                {data.phone}
              </div>
            </div>

            <div className="text-[9.5px] text-slate-400 leading-tight">
              <p className="truncate max-w-[175px]">{data.address}</p>
              {data.upiId && <p className="text-[8px] text-blue-400">UPI: {data.upiId}</p>}
            </div>
          </div>
        </div>

        {showWatermark && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[9px] text-slate-500 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  if (size === 'instagram') {
    return (
      <div className={containerClass}>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full" />

        <div className="flex justify-between items-start z-10 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-blue-400 font-black">INDUSTRIES DIRECTORY</span>
            <h1 className="text-xl font-black uppercase tracking-tight text-white mt-1">{data.businessName}</h1>
            <p className="text-xs text-slate-400 italic mt-0.5">"{data.tagline}"</p>
          </div>
          <div className="h-10 w-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-blue-400 font-black">
            P
          </div>
        </div>

        <div className="my-[4%] space-y-2.5 z-10">
          <span className="text-[9.5px] uppercase tracking-widest text-blue-400 block font-bold text-center">CONTRACTS & OPERATIONS</span>
          <div className="grid grid-cols-1 gap-1.5 px-2">
            {data.specialties.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 bg-slate-800/80 border border-slate-755 p-2 rounded-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-200 font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 flex justify-between items-end z-10 font-mono text-slate-300">
          <div className="space-y-1">
            <span className="text-[8px] text-blue-400 uppercase tracking-widest font-black block">OWNER OFFICE</span>
            <span className="text-xs font-bold text-white block">{data.ownerName}</span>
            <span className="text-xs font-bold text-white flex items-center mt-1">
              <Phone className="h-3 w-3 mr-1 text-blue-400" />
              {data.phone}
            </span>
          </div>

          <div className="text-right text-[10px] text-slate-400 max-w-[140px]">
            <span className="block text-[8px] tracking-widest font-black uppercase text-blue-400">HQ ADDRESS</span>
            <span>{data.address}</span>
          </div>
        </div>

        {showWatermark && (
          <div className="text-center text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-2">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  // WhatsApp portrait
  return (
    <div className={containerClass}>
      <div className="absolute top-1/3 left-0 w-44 h-44 bg-blue-500/5 blur-3xl opacity-30 rounded-full" />
      
      <div className="text-center py-6 border-b border-slate-800 z-10">
        <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3.5 py-0.5 rounded tracking-[0.25em] text-[8px] uppercase font-bold inline-block">CORPORATE VISITING CARD</span>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white mt-4">{data.businessName}</h1>
        <p className="text-xs text-slate-400 italic mt-2">"{data.tagline}"</p>
      </div>

      <div className="flex-1 my-8 flex flex-col justify-center space-y-4 z-10">
        <span className="text-[9px] uppercase tracking-widest text-blue-400 text-center block">BUSINESS DIVISIONS</span>
        <div className="space-y-3">
          {data.specialties.map((s, idx) => (
            <div key={idx} className="bg-slate-850 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5 shadow-lg">
              <span className="text-blue-500 text-xs">✔</span>
              <span className="text-xs font-bold text-slate-200 tracking-tight">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-slate-800 z-10">
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
          <span className="text-[9px] text-blue-400 uppercase tracking-widest block font-bold font-mono">MD SAMPLES</span>
          <h2 className="text-sm font-bold text-white uppercase">{data.ownerName}</h2>
          <div className="flex justify-center text-xs text-white bg-slate-900 border border-slate-800 py-1.5 rounded-xl max-w-[170px] mx-auto font-mono font-bold mt-1">
            <Phone className="h-3.5 w-3.5 mr-1 text-blue-400" />
            <span>{data.phone}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 max-w-[210px] mx-auto leading-relaxed">
            {data.address}
          </p>
        </div>

        {data.upiId && (
          <div className="text-center font-mono text-[9px] text-slate-400 border border-slate-800 p-1.5 rounded max-w-[200px] mx-auto">
            Bank Sync UPI: <span className="font-extrabold text-white">{data.upiId}</span>
          </div>
        )}

        {showWatermark && (
          <div className="text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    </div>
  );
}

// 6. Desi Template (saffron + green)
export function DesiTemplate({ data, size, showWatermark }: TemplateProps) {

  const containerClass = "bg-[#fffdf6] text-[#134226] relative w-full h-full flex flex-col justify-between font-sans overflow-hidden p-[6%] border-t-[8px] border-t-orange-500 border-b-[8px] border-b-emerald-600";

  if (size === 'facebook') {
    return (
      <div className={containerClass}>
        <div className="absolute right-0 top-0 w-24 h-full bg-[#f4841b]/5 pointer-events-none" />
        
        <div className="flex justify-between items-stretch h-full z-10">
          <div className="w-[60%] flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-block font-mono">जय हिन्द • स्वदेशी व्यापार</span>
              <h1 className="text-2xl font-black tracking-tight text-[#c65507] mt-1 select-all">{data.businessName}</h1>
              <p className="text-xs text-[#134226] font-extrabold">"{data.tagline}"</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8.5px] uppercase tracking-wider text-emerald-700 block font-bold">हमारी मुख्य विशेषताएँ / सेवाएं</span>
              <div className="flex flex-wrap gap-1">
                {data.specialties.map((s, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-extrabold">
                    ❀ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[35%] flex flex-col justify-between items-end text-right border-l border-orange-200 pl-4 font-mono">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-[#c65507] block">संचालक / मालिक</span>
              <h2 className="text-xs font-black text-emerald-850 mt-0.5">{data.ownerName}</h2>
              <div className="flex items-center justify-end text-xs font-black mt-1 text-[#c65507]">
                <Phone className="h-3.5 w-3.5 mr-1 text-orange-500" />
                {data.phone}
              </div>
            </div>

            <div className="text-[9.5px] text-emerald-800 leading-tight">
              <p className="truncate max-w-[175px]">{data.address}</p>
              {data.upiId && <p className="text-[8px] text-orange-600">UPI पेमेंट्स: {data.upiId}</p>}
            </div>
          </div>
        </div>

        {showWatermark && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[9px] text-[#294c34]/50 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  if (size === 'instagram') {
    return (
      <div className={containerClass}>
        <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />

        <div className="flex justify-between items-start z-10 border-b border-orange-100 pb-3">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-orange-600 block font-bold">जय श्री गणेश • स्वदेशी काम</span>
            <h1 className="text-xl font-black text-[#c65507] mt-1">{data.businessName}</h1>
            <p className="text-xs text-emerald-800 italic font-bold">"{data.tagline}"</p>
          </div>
          <div className="h-10 w-10 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center font-black text-orange-600 text-lg">
            ॐ
          </div>
        </div>

        <div className="my-[4%] space-y-2.5 z-10">
          <span className="text-[9.5px] uppercase tracking-widest text-emerald-800 block font-bold text-center border-b border-emerald-100 pb-1">हमारी उत्कृष्ट स्वदेशी सेवाएं</span>
          <div className="grid grid-cols-1 gap-1.5 px-1">
            {data.specialties.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 bg-white border border-emerald-100 p-2 rounded-xl shadow-sm">
                <span className="text-orange-500 font-bold text-sm">❀</span>
                <span className="text-xs text-[#134226] font-black">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-emerald-100 pt-3 flex justify-between items-end z-10 font-mono text-emerald-900">
          <div className="space-y-1">
            <span className="text-[8px] text-[#c65507] uppercase tracking-widest block font-bold">स्वत्वाधिकारी / मालिक</span>
            <span className="text-xs font-black text-emerald-950 block">{data.ownerName}</span>
            <span className="text-xs font-black text-[#c65507] flex items-center mt-1">
              <Phone className="h-3 w-3 mr-1 text-orange-500" />
              {data.phone}
            </span>
          </div>

          <div className="text-right text-[10px] text-emerald-800 max-w-[140px]">
            <span className="block text-[8px] tracking-widest font-black uppercase text-orange-600">पता / दुकान</span>
            <span className="font-medium text-[9px]">{data.address}</span>
          </div>
        </div>

        {showWatermark && (
          <div className="text-center text-[9px] text-[#134226]/50 font-mono uppercase tracking-widest mt-2">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    );
  }

  // WhatsApp portrait
  return (
    <div className={containerClass}>
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-emerald-600/5 to-transparent pointer-events-none" />
      
      <div className="text-center py-6 border-b border-orange-100 z-10">
        <span className="text-[10px] text-orange-600 tracking-[0.2em] uppercase font-black block">।। जय हिन्द • स्वदेशी उद्योग ।।</span>
        <h1 className="text-2xl font-black uppercase text-orange-600 mt-4 leading-tight">{data.businessName}</h1>
        <p className="text-xs text-[#134226] font-bold mt-2.5">"{data.tagline}"</p>
      </div>

      <div className="flex-1 my-8 flex flex-col justify-center space-y-4 z-10">
        <span className="text-[9.5px] uppercase tracking-widest text-[#c65507] text-center block font-black">विशेष स्वदेशी सेवाएं</span>
        <div className="space-y-3">
          {data.specialties.map((s, idx) => (
            <div key={idx} className="bg-white border border-emerald-100 p-4 rounded-2xl flex items-center space-x-3.5 shadow-md">
              <span className="text-orange-500 text-sm">❀</span>
              <span className="text-xs font-black text-emerald-950 tracking-tight">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-emerald-100 z-10">
        <div className="bg-white border border-emerald-55/60 rounded-2xl p-4 text-center space-y-2.5 shadow-sm">
          <span className="text-[9px] text-[#c65507] uppercase tracking-widest block font-black font-mono">मालिक और संपर्क सूत्र</span>
          <h2 className="text-sm font-bold text-emerald-950 uppercase">{data.ownerName}</h2>
          <div className="flex justify-center text-xs text-white bg-orange-500 py-1 rounded-xl max-w-[170px] mx-auto font-mono font-black mt-1">
            <Phone className="h-3.5 w-3.5 mr-1" />
            <span>{data.phone}</span>
          </div>
          <p className="text-xs text-emerald-800 mt-1.5 max-w-[210px] mx-auto leading-relaxed font-semibold">
            {data.address}
          </p>
        </div>

        {data.upiId && (
          <div className="text-center font-mono text-[9px] text-orange-600 bg-orange-50 border border-orange-100 p-1.5 rounded max-w-[200px] mx-auto">
            BHIM UPI Accepted • <span className="font-extrabold text-emerald-800">{data.upiId}</span>
          </div>
        )}

        {showWatermark && (
          <div className="text-center text-[10px] text-emerald-700/50 font-mono tracking-widest uppercase">
            ⚡ Made with BillKaro
          </div>
        )}
      </div>
    </div>
  );
}
