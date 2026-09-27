
import React from 'react';
import { PackingListItem } from '../types';
import { Plus, Trash2, Upload, FileJson } from 'lucide-react';

interface Props {
  items: PackingListItem[];
  onItemsChange: (items: PackingListItem[]) => void;
}

const ITEM_TYPES = [
  'Ladies Sweater (লেডিস সোয়েটার)',
  'Polo Shirt (মেনস পোলো)',
  'T-Shirt (টি-শার্ট)',
  'Hooded Fleece Sweater (হুডি সোয়েটার)',
  'Pants & Chinos (প্যান্টস)',
  'Denim Jeans (জিন্স)',
  'Ladies Cardigan (লেডিস কার্ডিগান)',
  'Boxer & Innerwear (বক্সার)',
  'Baby Wear (বেবি ওয়্যার)',
  'Woven Shirt (শার্ট)',
  'Custom / Manual Product (ম্যানুয়াল আইটেম)'
];
const PACKAGING_OPTIONS = ['single', '2pc', '3pc'];

const PackingListMatrix: React.FC<Props> = ({ items, onItemsChange }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addItem = (presetType?: string, presetDesc?: string) => {
    const newItem: PackingListItem = {
      id: crypto.randomUUID(),
      itemDescription: presetDesc || '',
      itemType: presetType || 'Ladies Sweater (লেডিস সোয়েটার)',
      brandName: '',
      packagingType: 'single',
      styleNumber: '',
      colorName: '',
      sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, '2XL': 0 },
      totalQty: 0,
      unitPrice: 0,
      totalAmount: 0,
      totalCartons: 0,
      cartonNumber: ''
    };
    onItemsChange([...items, newItem]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const newItems: PackingListItem[] = lines.slice(1).map(line => {
        const parts = line.split(',').map(p => p.trim());
        const sizes = {
          XS: parseInt(parts[5]) || 0,
          S: parseInt(parts[6]) || 0,
          M: parseInt(parts[7]) || 0,
          L: parseInt(parts[8]) || 0,
          XL: parseInt(parts[9]) || 0,
          '2XL': parseInt(parts[10]) || 0
        };
        const totalQty = (sizes.XS || 0) + sizes.S + sizes.M + sizes.L + sizes.XL + sizes['2XL'];
        const unitPrice = parseFloat(parts[11]) || 0;

        return {
          id: crypto.randomUUID(),
          cartonNumber: parts[0] || '',
          itemType: parts[1] || 'T-Shirt',
          itemDescription: parts[2] || '',
          styleNumber: parts[3] || '',
          colorName: parts[4] || '',
          sizes,
          totalQty,
          unitPrice,
          totalAmount: totalQty * unitPrice,
          totalCartons: parseInt(parts[12]) || 0
        };
      });

      onItemsChange([...items, ...newItems]);
      alert(`Successfully captured ${newItems.length} items from file.`);
    };
    reader.readAsText(file);
  };

  const updateItem = (id: string, updates: Partial<PackingListItem>) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        if (updates.sizes || updates.unitPrice) {
          const totalQty = (newItem.sizes.XS || 0) + (newItem.sizes.S || 0) + (newItem.sizes.M || 0) + (newItem.sizes.L || 0) + (newItem.sizes.XL || 0) + (newItem.sizes['2XL'] || 0);
          newItem.totalQty = totalQty;
          newItem.totalAmount = totalQty * newItem.unitPrice;
        }
        return newItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <span>Item Specifications & Packing Matrix</span>
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black normal-case">
              ম্যানুয়াল টাইপিং ও সিলেকশন
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            লিস্ট থেকে সিলেক্ট করুন অথবা নিচে সরাসরি প্রডাক্ট ডেসক্রিপশন ও ব্র্যান্ডের নাম টাইপ করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,image/*,.pdf"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all text-[11px] font-black cursor-pointer"
          >
            <Upload size={14} />
            <span>AI CAPTURE (IMG/CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => addItem()}
            className="flex items-center space-x-1.5 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-red-600 transition-all text-[11px] font-black shadow-md cursor-pointer"
          >
            <Plus size={16} />
            <span>ADD NEW ITEM</span>
          </button>
        </div>
      </div>

      {/* Quick Select Preset Garments & Sweaters Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar text-xs">
        <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap mr-1">
          Quick Add:
        </span>
        <button
          type="button"
          onClick={() => addItem('Ladies Sweater (লেডিস সোয়েটার)', 'Ladies Crewneck Chunky Knit Sweater')}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer"
        >
          + লেডিস সোয়েটার (Ladies Sweater)
        </button>
        <button
          type="button"
          onClick={() => addItem('Hooded Fleece Sweater (হুডি সোয়েটার)', 'Unisex Heavyweight Brushed Fleece Hoodie')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer"
        >
          + হুডি সোয়েটার (Fleece Hoodie)
        </button>
        <button
          type="button"
          onClick={() => addItem('Polo Shirt (মেনস পোলো)', 'Combed Cotton Pique Polo Shirt')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer"
        >
          + পোলো শার্ট (Polo Shirt)
        </button>
        <button
          type="button"
          onClick={() => addItem('Denim Jeans (জিন্স)', 'Stretch Fit Denim Trousers 5-Pocket')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer"
        >
          + ডেনিম জিন্স (Denim Jeans)
        </button>
        <button
          type="button"
          onClick={() => addItem('Ladies Cardigan (লেডিস কার্ডিগান)', 'Fine Gauge Cashmere Touch Cardigan')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer"
        >
          + কার্ডিগান (Cardigan)
        </button>
        <button
          type="button"
          onClick={() => addItem('Custom / Manual Product (ম্যানুয়াল আইটেম)', '')}
          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer"
        >
          ✍ ম্যানুয়াল টাইপ (Custom Type)
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <th className="px-3 py-4 min-w-[200px]">Item / Product Name (ম্যানুয়াল টাইপ)</th>
              <th className="px-3 py-4 min-w-[110px]">Brand (ব্র্যান্ড)</th>
              <th className="px-3 py-4 min-w-[100px]">Style #</th>
              <th className="px-3 py-4 min-w-[90px]">Color</th>
              <th className="px-2 py-4 text-center">XS</th>
              <th className="px-2 py-4 text-center">S</th>
              <th className="px-2 py-4 text-center">M</th>
              <th className="px-2 py-4 text-center">L</th>
              <th className="px-2 py-4 text-center">XL</th>
              <th className="px-2 py-4 text-center">2XL</th>
              <th className="px-3 py-4">Total Pcs</th>
              <th className="px-3 py-4">Price</th>
              <th className="px-3 py-4">Cartons</th>
              <th className="px-2 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1.5">
                    {/* Item Type Selector */}
                    <select
                      value={item.itemType}
                      onChange={(e) => updateItem(item.id, { itemType: e.target.value })}
                      className="text-xs font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      {ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>

                    {/* Manual Product Description / Item Name Typing Input */}
                    <input
                      type="text"
                      className="text-xs text-slate-800 px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none placeholder-slate-400 font-medium"
                      placeholder="আইটেম নেম / বিবরণ টাইপ করুন (যেমন: 100% Cashmere Ladies Sweater)..."
                      value={item.itemDescription}
                      onChange={(e) => updateItem(item.id, { itemDescription: e.target.value })}
                    />

                    {item.itemType?.includes('Boxer') && (
                      <select 
                        value={item.packagingType}
                        onChange={(e) => updateItem(item.id, { packagingType: e.target.value as any })}
                        className="text-[10px] text-blue-700 font-bold bg-blue-50 rounded px-1.5 py-0.5 border border-blue-200"
                      >
                         {PACKAGING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} Pack</option>)}
                      </select>
                    )}
                  </div>
                </td>

                {/* Brand Name Input */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={item.brandName || ''}
                    onChange={(e) => updateItem(item.id, { brandName: e.target.value })}
                    className="w-full text-xs font-bold text-slate-900 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-200 outline-none placeholder-slate-400"
                    placeholder="e.g. Hanwha / Tommy"
                  />
                </td>

                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={item.styleNumber}
                    onChange={(e) => updateItem(item.id, { styleNumber: e.target.value })}
                    className="w-full text-xs font-medium px-2 py-1 border border-slate-200 rounded-lg bg-transparent focus:ring-1 focus:ring-red-200"
                    placeholder="RB-STY-801"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={item.colorName}
                    onChange={(e) => updateItem(item.id, { colorName: e.target.value })}
                    className="w-full text-xs font-medium px-2 py-1 border border-slate-200 rounded-lg bg-transparent focus:ring-1 focus:ring-red-200"
                    placeholder="Navy / Melange"
                  />
                </td>
                {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((size) => (
                  <td key={size} className="px-1 py-4">
                    <input
                      type="number"
                      value={item.sizes[size as keyof typeof item.sizes]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateItem(item.id, { 
                          sizes: { ...item.sizes, [size]: val } 
                        });
                      }}
                      className="w-full text-xs text-center font-bold border-none bg-transparent focus:ring-1 focus:ring-red-100 rounded"
                    />
                  </td>
                ))}
                <td className="px-3 py-4 font-black text-slate-900 text-xs">
                  {item.totalQty}
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center text-xs font-bold text-red-600">
                    <span className="mr-0.5">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full border-none bg-transparent focus:ring-0 p-0"
                    />
                  </div>
                </td>
                <td className="px-3 py-4">
                  <input
                    type="number"
                    value={item.totalCartons || ''}
                    onChange={(e) => updateItem(item.id, { totalCartons: parseInt(e.target.value) || 0 })}
                    className="w-16 text-xs text-center border border-slate-200 rounded p-1"
                    placeholder="CTN"
                  />
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-bold">
              <td colSpan={3} className="px-4 py-4 text-right uppercase text-[10px] tracking-widest text-slate-400">Grand Total Breakdown:</td>
              <td className="px-1 py-4 text-center text-red-400 text-xs">{items.reduce((sum, item) => sum + (item.sizes.XS || 0), 0)}</td>
              <td className="px-1 py-4 text-center text-red-400 text-xs">{items.reduce((sum, item) => sum + item.sizes.S, 0)}</td>
              <td className="px-1 py-4 text-center text-red-400 text-xs">{items.reduce((sum, item) => sum + item.sizes.M, 0)}</td>
              <td className="px-1 py-4 text-center text-red-400 text-xs">{items.reduce((sum, item) => sum + item.sizes.L, 0)}</td>
              <td className="px-1 py-4 text-center text-red-400 text-xs">{items.reduce((sum, item) => sum + item.sizes.XL, 0)}</td>
              <td className="px-1 py-4 text-center text-red-400 text-xs">{items.reduce((sum, item) => sum + item.sizes['2XL'], 0)}</td>
              <td className="px-3 py-4 text-white text-sm font-black whitespace-nowrap">{items.reduce((sum, item) => sum + item.totalQty, 0)} PCS</td>
              <td className="px-3 py-4 text-green-400 text-sm font-black whitespace-nowrap border-l border-white/10">${items.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}</td>
              <td className="px-3 py-4 text-blue-400 text-sm font-black">{items.reduce((sum, item) => sum + (item.totalCartons || 0), 0)} CTN</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PackingListMatrix;
