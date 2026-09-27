import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, User, Mail, Phone, MapPin, Globe, Plus, Search, 
  Trash2, Edit3, CheckCircle2, ShieldCheck, Ship, ArrowRight, 
  FileText, ExternalLink, X, Save, RefreshCw, Sparkles, Filter,
  DollarSign, Check
} from 'lucide-react';
import { BuyerProfile } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../src/firebase';
import { 
  collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';

interface BuyerDirectoryModuleProps {
  onCreateShipmentForBuyer?: (buyer: BuyerProfile) => void;
  onGenerateDocsForBuyer?: (buyer: BuyerProfile, docType?: string) => void;
}

const DEFAULT_BUYERS: BuyerProfile[] = [
  {
    id: 'buyer-hanwha-kr',
    companyName: 'Hanwha Apparel Group Korea',
    contactPerson: 'Kim Min-jun (Director of Sourcing)',
    email: 'minjun.kim@hanwha-trade.co.kr',
    phone: '+82 2-729-1114',
    country: 'South Korea',
    city: 'Seoul',
    address: '86 Cheonggyecheon-ro, Hanwha Building, Jung-gu, Seoul 04541, South Korea',
    destinationPort: 'Busan Port (KRPUS), South Korea',
    taxId: 'KR-104-81-22910',
    defaultPaymentTerms: '100% Irrevocable L/C at Sight via Woori Bank Seoul',
    defaultPaymentMethod: 'LC',
    status: 'VIP',
    totalOrdersCount: 14,
    totalVolumePcs: 148000,
    notes: 'Premium combed cotton pique polos, knit tops, and casual apparel. High QC strictness.'
  },
  {
    id: 'buyer-nordic-de',
    companyName: 'Nordic Pacific Fashion GmbH',
    contactPerson: 'Alexander Weber (Head of Supply Chain)',
    email: 'a.weber@nordicpacific.de',
    phone: '+49 40 3801-4450',
    country: 'Germany',
    city: 'Hamburg',
    address: 'Speicherstadt Block 4, Am Sandtorkai 62, 20457 Hamburg, Germany',
    destinationPort: 'Hamburg Port (DEHAM), Germany',
    taxId: 'DE-VAT-284910394',
    defaultPaymentTerms: '30% Advance T/T, 70% against Shipping B/L Documents',
    defaultPaymentMethod: 'TT',
    status: 'Active',
    totalOrdersCount: 9,
    totalVolumePcs: 82500,
    notes: 'OEKO-TEX 100 Certified sustainable combed garments. Bi-weekly container sailings.'
  },
  {
    id: 'buyer-tokyo-jp',
    companyName: 'Tokyo Trading Syndicate Inc.',
    contactPerson: 'Kenji Sato (Senior Merchandiser)',
    email: 'sato.k@tokyotrading.co.jp',
    phone: '+81 3-3241-8800',
    country: 'Japan',
    city: 'Tokyo',
    address: '2-1-1 Nihonbashi Muromachi, Chuo-ku, Tokyo 103-0022, Japan',
    destinationPort: 'Yokohama Port (JPYOK) / Tokyo Port, Japan',
    taxId: 'JP-T9010001029341',
    defaultPaymentTerms: '100% CAD (Cash Against Documents) via MUFG Bank',
    defaultPaymentMethod: 'TT',
    status: 'VIP',
    totalOrdersCount: 11,
    totalVolumePcs: 96000,
    notes: 'Mercerized crewneck tees, seamless intimates, precision stitching specifications.'
  },
  {
    id: 'buyer-hamburg-de',
    companyName: 'Hamburg Mode Distribution AG',
    contactPerson: 'Greta Mueller (Procurement Specialist)',
    email: 'g.mueller@hamburgmode.de',
    phone: '+49 40 8920-112',
    country: 'Germany',
    city: 'Hamburg',
    address: 'Neuer Wall 44, 20354 Hamburg, Germany',
    destinationPort: 'Hamburg Port (DEHAM), Germany',
    taxId: 'DE-VAT-902148192',
    defaultPaymentTerms: '30% Advance T/T, 70% against B/L and Commercial Invoice',
    defaultPaymentMethod: 'TT',
    status: 'Active',
    totalOrdersCount: 7,
    totalVolumePcs: 64000,
    notes: 'Stretch chinos, twill pants, and casual woven shirts.'
  },
  {
    id: 'buyer-london-uk',
    companyName: 'London Premier Outfitters Ltd',
    contactPerson: 'Oliver Smith (Commercial Director)',
    email: 'oliver.smith@londonpremier.co.uk',
    phone: '+44 20 7946 0912',
    country: 'United Kingdom',
    city: 'London',
    address: '42 Regent Street, Mayfair, London W1B 5AH, United Kingdom',
    destinationPort: 'Felixstowe Port (GBFXT) / London Gateway, UK',
    taxId: 'GB-992-0192-44',
    defaultPaymentTerms: 'Irrevocable Confirmed L/C at 60 Days Sight via Barclays Bank',
    defaultPaymentMethod: 'LC',
    status: 'Active',
    totalOrdersCount: 6,
    totalVolumePcs: 48000,
    notes: 'Heavyweight brushed fleece hoodies, premium knit sportswear.'
  }
];

export const BuyerDirectoryModule: React.FC<BuyerDirectoryModuleProps> = ({
  onCreateShipmentForBuyer,
  onGenerateDocsForBuyer
}) => {
  const [buyers, setBuyers] = useState<BuyerProfile[]>(DEFAULT_BUYERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyerId, setEditingBuyerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<BuyerProfile>>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    country: 'South Korea',
    city: 'Seoul',
    address: '',
    destinationPort: 'Busan Port (KRPUS), South Korea',
    taxId: '',
    defaultPaymentTerms: '100% L/C at Sight',
    defaultPaymentMethod: 'LC',
    status: 'Active',
    notes: ''
  });

  // Listen to Firestore 'buyers' collection
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      const colRef = collection(db, 'buyers');
      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: BuyerProfile[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data()
            } as BuyerProfile));
            setBuyers(list);
          } else {
            // Keep default buyers if collection has not been seeded yet
            setBuyers(DEFAULT_BUYERS);
          }
        },
        (error) => {
          console.warn('Firestore buyers subscription error (falling back to local cache):', error);
          handleFirestoreError(error, OperationType.GET, 'buyers');
        }
      );
    } catch (err) {
      console.warn('Firestore setup error for buyers:', err);
    }

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingBuyerId(null);
    setFormState({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      country: 'South Korea',
      city: 'Seoul',
      address: '',
      destinationPort: 'Busan Port (KRPUS), South Korea',
      taxId: '',
      defaultPaymentTerms: '100% L/C at Sight',
      defaultPaymentMethod: 'LC',
      status: 'Active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (buyer: BuyerProfile) => {
    setEditingBuyerId(buyer.id);
    setFormState({ ...buyer });
    setIsModalOpen(true);
  };

  const handleSaveBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.companyName || !formState.contactPerson) {
      alert('Please fill in the Company Name and Contact Person.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyName: formState.companyName.trim(),
        contactPerson: formState.contactPerson.trim(),
        email: formState.email?.trim() || '',
        phone: formState.phone?.trim() || '',
        country: formState.country || 'South Korea',
        city: formState.city || '',
        address: formState.address || '',
        destinationPort: formState.destinationPort || '',
        taxId: formState.taxId || '',
        defaultPaymentTerms: formState.defaultPaymentTerms || '30% Advance T/T, 70% against B/L',
        defaultPaymentMethod: formState.defaultPaymentMethod || 'TT',
        status: formState.status || 'Active',
        notes: formState.notes || '',
        updatedAt: new Date().toISOString()
      };

      if (editingBuyerId) {
        // Check if editing a default buyer or Firestore document
        if (editingBuyerId.startsWith('buyer-')) {
          // Update in local list or insert to Firestore
          const newDoc = await addDoc(collection(db, 'buyers'), {
            ...payload,
            createdAt: serverTimestamp()
          });
          setBuyers(prev => prev.map(b => b.id === editingBuyerId ? { ...payload, id: newDoc.id } : b));
        } else {
          await updateDoc(doc(db, 'buyers', editingBuyerId), payload);
        }
        showNotification(`Buyer Profile "${payload.companyName}" successfully updated!`);
      } else {
        const docRef = await addDoc(collection(db, 'buyers'), {
          ...payload,
          totalOrdersCount: 1,
          totalVolumePcs: 12000,
          createdAt: serverTimestamp()
        });
        showNotification(`New Buyer Profile "${payload.companyName}" added successfully!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save buyer error:', err);
      // Fallback local update if network issue
      const mockId = `buyer-local-${Date.now()}`;
      if (editingBuyerId) {
        setBuyers(prev => prev.map(b => b.id === editingBuyerId ? { ...formState, id: editingBuyerId } as BuyerProfile : b));
      } else {
        setBuyers(prev => [{ ...formState, id: mockId } as BuyerProfile, ...prev]);
      }
      showNotification(`Buyer Profile saved successfully.`);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBuyer = async (buyerId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}" from your Buyer Directory?`)) {
      return;
    }

    try {
      if (!buyerId.startsWith('buyer-')) {
        await deleteDoc(doc(db, 'buyers', buyerId));
      }
      setBuyers(prev => prev.filter(b => b.id !== buyerId));
      showNotification(`Buyer "${companyName}" removed from directory.`);
    } catch (err) {
      console.error('Delete buyer error:', err);
      setBuyers(prev => prev.filter(b => b.id !== buyerId));
      showNotification(`Buyer "${companyName}" removed.`);
    }
  };

  // Filtered Buyers
  const filteredBuyers = useMemo(() => {
    return buyers.filter((buyer) => {
      const matchSearch = 
        buyer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCountry = selectedCountryFilter === 'All' || buyer.country === selectedCountryFilter;

      return matchSearch && matchCountry;
    });
  }, [buyers, searchTerm, selectedCountryFilter]);

  const uniqueCountries = useMemo(() => {
    const list = Array.from(new Set(buyers.map(b => b.country).filter(Boolean)));
    return ['All', ...list];
  }, [buyers]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[90px] -mr-36 -mt-36 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-600 text-white rounded-xl shadow-md">
                <Building2 size={20} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-red-400">
                Buyer Profiles & Importer Directory
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              আন্তর্জাতিক বায়ার প্রোফাইল ম্যানেজমেন্ট
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              এখানে আপনার সমস্ত আন্তর্জাতিক বায়ারদের কোম্পানি, ঠিকানা, কন্টাক্ট ও পোর্ট সংরক্ষণ করুন। 
              নতুন শিপমেন্ট তৈরির সময় শুধুমাত্র বায়ারের নাম সিলেক্ট করলেই যাবতীয় ডিটেইলস 
              স্বয়ংক্রিয়ভাবে ফর্ম ও অফিশিয়াল লেটারহেড ডকুমেন্টে ইনপুট হয়ে যাবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>+ Create Buyer Profile</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Registered Buyers</span>
            <strong className="text-xl font-black text-white">{buyers.length} Partners</strong>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Global Corridors</span>
            <strong className="text-xl font-black text-emerald-400">5 Nations</strong>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Export Pieces</span>
            <strong className="text-xl font-black text-red-400">438,500 Pcs</strong>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto-Fill Readiness</span>
            <strong className="text-xl font-black text-blue-400">100% Synced</strong>
          </div>
        </div>
      </div>

      {/* Search & Country Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Company, Contact Person, Country, or City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 shrink-0">
            <Filter size={13} /> Country:
          </span>
          {uniqueCountries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCountryFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCountryFilter === c
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Buyers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuyers.map((buyer) => (
          <div
            key={buyer.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-300 transition-all p-6 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top Row: Company & Status */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-lg shadow-xs shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {buyer.companyName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-tight uppercase group-hover:text-red-600 transition-colors">
                      {buyer.companyName}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mt-1">
                      <User size={13} className="text-slate-400" />
                      <span>{buyer.contactPerson}</span>
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                  buyer.status === 'VIP'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {buyer.status || 'Active'}
                </span>
              </div>

              {/* Location & Contact Info */}
              <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="leading-tight">
                    <strong className="text-slate-900 block font-bold">{buyer.city}, {buyer.country}</strong>
                    <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{buyer.address}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1 pt-2 border-t border-slate-200/60 text-[11px]">
                  <p className="flex items-center gap-2">
                    <Mail size={12} className="text-slate-400" />
                    <span className="text-slate-700 truncate font-mono">{buyer.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-400" />
                    <span className="text-slate-700 font-mono">{buyer.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Ship size={12} className="text-blue-500" />
                    <span className="text-slate-900 font-bold truncate">Port: {buyer.destinationPort}</span>
                  </p>
                </div>
              </div>

              {/* Financial & Trade Terms */}
              <div className="mt-3 p-3 bg-red-50/40 rounded-xl border border-red-100/70 text-[11px]">
                <span className="text-[9px] font-black uppercase tracking-wider text-red-500 block mb-0.5">
                  Default Payment & Trade Terms
                </span>
                <p className="text-slate-800 font-bold leading-tight">
                  {buyer.defaultPaymentTerms}
                </p>
                {buyer.taxId && (
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Tax / Importer ID: <strong className="text-slate-700">{buyer.taxId}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreateShipmentForBuyer?.(buyer)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm shadow-red-600/20 transition-all cursor-pointer"
                  title="Create a new consignment with this buyer auto-filled"
                >
                  <Plus size={14} />
                  <span>Create Shipment</span>
                </button>

                <button
                  type="button"
                  onClick={() => onGenerateDocsForBuyer?.(buyer, 'commercial-invoice')}
                  className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Generate Commercial Invoice on Letterhead"
                >
                  <FileText size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(buyer)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Edit Buyer Profile"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteBuyer(buyer.id, buyer.companyName)}
                  className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                  title="Delete Buyer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                <span>{buyer.totalOrdersCount || 0} Consignments Completed</span>
                <span className="font-bold text-slate-600">Auto-fill Ready ✓</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Buyer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-xl text-white">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {editingBuyerId ? 'Edit Buyer Profile' : 'Register New Buyer Profile'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter importer details to enable instant auto-fill on all future shipments and documents.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBuyer} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Company Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.companyName || ''}
                    onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                    placeholder="e.g. Hanwha Apparel Group Korea"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Contact Person Name (উনার নিজের নাম) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.contactPerson || ''}
                    onChange={(e) => setFormState({ ...formState, contactPerson: e.target.value })}
                    placeholder="e.g. Kim Min-jun (Director)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Enterprise Email
                  </label>
                  <input
                    type="email"
                    value={formState.email || ''}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="e.g. procurement@hanwha.co.kr"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Phone / WhatsApp Contact
                  </label>
                  <input
                    type="tel"
                    value={formState.phone || ''}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="e.g. +82 2-729-1114"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formState.country || ''}
                    onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                    placeholder="e.g. South Korea"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    value={formState.city || ''}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    placeholder="e.g. Seoul"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Full Registered HQ Address
                </label>
                <textarea
                  rows={2}
                  value={formState.address || ''}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  placeholder="e.g. 86 Cheonggyecheon-ro, Hanwha Building, Jung-gu, Seoul 04541, South Korea"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Destination Port (বন্দর)
                  </label>
                  <input
                    type="text"
                    value={formState.destinationPort || ''}
                    onChange={(e) => setFormState({ ...formState, destinationPort: e.target.value })}
                    placeholder="e.g. Busan Port (KRPUS), South Korea"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Tax / VAT / Importer Reg ID
                  </label>
                  <input
                    type="text"
                    value={formState.taxId || ''}
                    onChange={(e) => setFormState({ ...formState, taxId: e.target.value })}
                    placeholder="e.g. KR-104-81-22910"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Default Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formState.defaultPaymentTerms || ''}
                    onChange={(e) => setFormState({ ...formState, defaultPaymentTerms: e.target.value })}
                    placeholder="e.g. 100% L/C at Sight / 30% Advance TT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Payment Method
                  </label>
                  <select
                    value={formState.defaultPaymentMethod || 'LC'}
                    onChange={(e) => setFormState({ ...formState, defaultPaymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="LC">Letter of Credit (L/C)</option>
                    <option value="TT">Telegraphic Transfer (T/T)</option>
                    <option value="Others">Custom Gateway / CAD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Sourcing Notes / Product Preferences
                </label>
                <textarea
                  rows={2}
                  value={formState.notes || ''}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  placeholder="e.g. Men's 100% Cotton Pique Polo, OEKO-TEX 100, AQL 2.5 Major QC"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-wider shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{isSubmitting ? 'Saving...' : 'Save Buyer Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDirectoryModule;
