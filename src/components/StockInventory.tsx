import React, { useState } from 'react';
import useAppStore from '../store';
import { 

  AlertTriangle, 
  Plus, 
  Trash2, 
  Database, 
  ChevronRight, 
  Check, 
  X, 
  CornerDownRight, 
  Package,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

export default function StockInventory() {

  const { inventory, addInventoryItem, updateStock, deleteInventoryItem } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);

  // Add Item form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Raw Materials');
  const [stockCount, setStockCount] = useState('50');
  const [unit, setUnit] = useState('Kg');
  const [minRequired, setMinRequired] = useState('20');
  const [price, setPrice] = useState('65');

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !stockCount) return;

    addInventoryItem({
      name,
      category,
      stockCount: parseFloat(stockCount) || 0,
      unit,
      minimumRequired: parseFloat(minRequired) || 10,
      purchasePrice: parseFloat(price) || 0
    });

    setName('');
    setStockCount('50');
    setMinRequired('20');
    setShowAddForm(false);
    alert("New inventory item safely recorded!");
  };

  const handleStockAdj = (id: string, current: number, delta: number) => {
    const nextVal = Math.max(0, current + delta);
    updateStock(id, nextVal);
  };

  return (
    <div className="space-y-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-[#222E4A] pb-2">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-gray-100">सामग्री स्टॉक और इन्वेंटरी (Phase 2 - Active Beta)</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-1 px-2.5 rounded text-xs flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Stock Mal</span>
        </button>
      </div>

      {/* Intro info card to establish value */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center space-x-3">
        <Database className="h-7 w-7 text-amber-500 shrink-0" />
        <div className="text-[11.5px] text-gray-300 leading-normal">
          <b className="text-amber-500">लोहा, सरिया, मशीन और गैस सिलेंडर:</b> Apne workshop saria levels, consumables stock direct update karein. Stock limit se niche hone par alert flashing red ho jayega!
        </div>
      </div>

      {/* Add Stock material form */}
      {showAddForm && (
        <form onSubmit={handleAddItemSubmit} className="bg-[#151D30] border border-[#222E4A] p-4 rounded-xl space-y-3.5 shadow-lg">
          <div className="flex justify-between items-center pb-2 border-b border-[#222E4A]">
            <h3 className="text-xs font-bold text-amber-500 uppercase">नया स्टॉक आइटम जोड़ें</h3>
            <button type="button" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">सामग्री का नाम (Item name) *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Anchor Bolts 14mm structure steel"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#222E4A] rounded p-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">श्रेणी (Category)</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-[#222E4A] rounded p-1.5 text-xs text-white"
              >
                <option value="Raw Materials">Raw Steel/Iron (लोहा-सरिया)</option>
                <option value="Consumables">Welding/Gas (कंज्यूमवेबल्स)</option>
                <option value="Hardware Parts">Hardware parts (पार्ट्स)</option>
                <option value="Tools">Tools/Machine (औजार)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-mono">मापन इकाई (Unit: Kg, Pcs, Box)</label>
              <input 
                type="text" 
                placeholder="e.g. Kg, Box, Pcs"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-[#222E4A] rounded p-1.5 text-xs text-white text-center font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Current Stock *</label>
              <input 
                type="number"
                required
                value={stockCount}
                onChange={e => setStockCount(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-[#222E4A] rounded p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Safety Limit *</label>
              <input 
                type="number"
                required
                value={minRequired}
                onChange={e => setMinRequired(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-[#222E4A] rounded p-1.5 text-xs text-red-400 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">खरीद दर (Price/Unit)</label>
              <input 
                type="number"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-[#222E4A] rounded p-1.5 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2 rounded text-xs transition uppercase"
          >
            आइटम सहेजें (Save Item)
          </button>
        </form>
      )}

      {/* Grid inventory listing */}
      <div className="space-y-2.5">
        {inventory.map(item => {
          const isLow = item.stockCount <= item.minimumRequired;
          const ratio = Math.max(5, Math.min(100, (item.stockCount / (item.minimumRequired * 2 || 100)) * 100));

          return (
            <div 
              key={item.id}
              className="bg-[#151D30] border border-[#222E4A] p-3 rounded-xl space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] bg-[#0B0F1A] font-mono text-gray-400 uppercase py-0.5 px-1.5 rounded">{item.category}</span>
                  <h4 className="text-xs font-black text-gray-100 mt-1">{item.name}</h4>
                </div>

                <div className="text-right">
                  <span className="text-[8px] text-gray-500 block">AVAILABLE QUANTITY</span>
                  <span className={`text-sm font-extrabold font-mono ${isLow ? 'text-red-400' : 'text-[#10B981]'}`}>
                    {item.stockCount} {item.unit}
                  </span>
                </div>
              </div>

              {/* Stock status slider / dynamic bar */}
              <div className="space-y-1">
                <div className="w-full bg-[#0B0F1A] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                    style={{ width: `${ratio}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9.5px]">
                  <span className="text-gray-500">Alert Limit: {item.minimumRequired} {item.unit}</span>
                  {isLow ? (
                    <span className="text-red-400 font-bold bg-red-400/5 px-2 rounded border border-red-500/20 text-[8px] tracking-wide animate-pulse">
                      ⚠️ मॉप खत्म होने वाला है! (Low stock)
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-bold">✓ Stock safe bar</span>
                  )}
                </div>
              </div>

              {/* Adjust stock value inline counter */}
              <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-[#1E293B]">
                <span className="text-[10px] text-gray-400 font-sans">
                  खरीद: ₹{item.purchasePrice}/{item.unit}
                </span>

                <div className="flex items-center space-x-2">
                  <span className="text-[9px] text-gray-500">एडजस्ट करें:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStockAdj(item.id, item.stockCount, -1)}
                      className="bg-[#0B0F1A] text-gray-300 font-bold px-2 py-0.5 rounded text-xs hover:text-white"
                      title="-1 unit"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStockAdj(item.id, item.stockCount, 5)}
                      className="bg-[#0B0F1A] text-gray-300 font-bold px-1.5 py-0.5 rounded text-[10px] hover:text-white"
                      title="+5 unit"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleStockAdj(item.id, item.stockCount, 1)}
                      className="bg-[#0B0F1A] text-gray-300 font-bold px-2 py-0.5 rounded text-xs hover:text-white"
                      title="+1 unit"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Kya is item ko stock list se alag karna chahte hain?")) deleteInventoryItem(item.id);
                    }}
                    className="text-gray-500 hover:text-red-400 shrink-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
