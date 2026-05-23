import React, { useState } from 'react';
import { CardData } from './CardTemplates';
import { Sparkles, Phone, MapPin, Tag, User, Briefcase, Plus, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';


interface CardEditorProps {
  data: CardData;
  onChange: (updated: CardData) => void;
  onReset: () => void;
}

export default function CardEditor({ data, onChange, onReset }: CardEditorProps) {

  const [newSpecialty, setNewSpecialty] = useState('');

  const handleChange = (field: keyof CardData, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleAddSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialty.trim()) return;
    
    if (data.specialties.length >= 4) {
      toast.error('कार्ड में डिज़ाइन के अनुसार ज्यादा से ज्यादा 4 मुख्य विशेषताएं ही उपयुक्त रहती हैं!');
      return;
    }

    onChange({
      ...data,
      specialties: [...data.specialties, newSpecialty.trim()]
    });
    setNewSpecialty('');
    toast.success('विशेषता जोड़ी गयी!');
  };

  const handleRemoveSpecialty = (index: number) => {
    onChange({
      ...data,
      specialties: data.specialties.filter((_, idx) => idx !== index)
    });
    toast.success('विशेषता हटाई गयी!');
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-5 shadow-xl animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
            कार्ड एडिटर पैनल (Card Customizer)
          </h3>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] bg-gray-950 border border-gray-850 hover:bg-gray-850 text-gray-400 py-1 px-2.5 rounded-lg flex items-center space-x-1 font-mono transition"
          title="Profile के बेसिक डिटेल्स वापस भरें"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset to Profile</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Kaam / Business Name */}
        <div>
          <label className="text-[10px] uppercase font-black text-gray-400 block mb-1 font-mono tracking-wider">
            व्यापार का नाम (Kaam / Business Name)
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-650" />
            <input
              type="text"
              required
              placeholder="e.g. Aman Fabrication Works"
              value={data.businessName}
              onChange={e => handleChange('businessName', e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-800 text-xs rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Dynamic Tagline */}
        <div>
          <label className="text-[10px] uppercase font-black text-gray-400 block mb-1 font-mono tracking-wider">
            व्यापार का नारा (Slogan / Tagline)
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-650" />
            <input
              type="text"
              placeholder="e.g. मजबूत काम, सही दाम और भरोसा!"
              value={data.tagline}
              onChange={e => handleChange('tagline', e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-800 text-xs rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>

        {/* 2 Grid fields: Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-black text-gray-400 block mb-1 font-mono tracking-wider">
              मालिक का नाम (Naam / Owner Name)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-650" />
              <input
                type="text"
                required
                placeholder="Aman Sharma"
                value={data.ownerName}
                onChange={e => handleChange('ownerName', e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 text-xs rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-gray-400 block mb-1 font-mono tracking-wider">
              फ़ोन नंबर (Phone Contact)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-650" />
              <input
                type="text"
                required
                placeholder="9876XXXXXX"
                value={data.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 text-xs rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Area / Address */}
        <div>
          <label className="text-[10px] uppercase font-black text-gray-400 block mb-1 font-mono tracking-wider">
            पता / कार्यक्षेत्र (Area / Address)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-650" />
            <input
              type="text"
              required
              placeholder="Aligarh, Industrial Hub"
              value={data.address}
              onChange={e => handleChange('address', e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-800 text-xs rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Specialties manager */}
        <div className="space-y-2 border-t border-gray-850 pt-3">
          <label className="text-[10px] uppercase font-black text-amber-500 block font-mono tracking-wider">
            मुख्य सेवाएं जोड़े / Specialties (Max 4)
          </label>
          
          <form onSubmit={handleAddSpecialty} className="flex space-x-1.5">
            <input
              type="text"
              placeholder="e.g. Specialists in Gate, Grill, Loha Work"
              value={newSpecialty}
              onChange={e => setNewSpecialty(e.target.value)}
              className="flex-1 bg-[#0B0F1A] border border-gray-800 rounded-xl p-2 text-xs text-white placeholder-gray-650 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer font-mono"
            >
              <Plus className="h-4 w-4 mr-0.5" /> Add
            </button>
          </form>

          {/* List current specialties with deletion */}
          <div className="space-y-1 max-h-[140px] overflow-y-auto pt-1">
            {data.specialties.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] bg-[#161B29] border border-gray-850 px-3 py-2 rounded-xl">
                <span className="text-gray-200 select-all font-medium truncate pr-2">{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(idx)}
                  className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {data.specialties.length === 0 && (
              <span className="text-[10.5px] text-gray-550 italic block text-center py-1 font-mono">
                कम से कम एक मुख्य विशेषता अवश्य जोड़ें!
              </span>
            )}
          </div>
        </div>

        {/* UPI Payments Accepted custom tracker */}
        <div className="border-t border-gray-850 pt-3">
          <label className="text-[10px] uppercase font-black text-gray-400 block mb-1 font-mono">
            UPI ID (Optional - For QR badge rendering)
          </label>
          <input
            type="text"
            placeholder="amansharma@sbi"
            value={data.upiId}
            onChange={e => handleChange('upiId', e.target.value)}
            className="w-full bg-[#0B0F1A] border border-gray-800 text-xs rounded-xl p-2 text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
