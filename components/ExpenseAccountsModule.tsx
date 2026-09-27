import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  UserCheck, 
  Building, 
  Tag, 
  Calendar, 
  CreditCard, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Users,
  Briefcase,
  Download,
  Filter
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Expense } from '../types';

export interface ExpenseAccountProfile {
  id?: string;
  accountName: string; // Beneficiary / For whom money is spent
  category: string;
  accountType: 'Vendor/Supplier' | 'Logistics & Customs' | 'Employee/Staff' | 'Government/Duty' | 'Utilities' | 'Other';
  contactPerson?: string;
  phone?: string;
  email?: string;
  paymentDetails?: string; // Bank account or bKash
  totalSpent?: number;
  createdAt?: string;
}

export const ExpenseAccountsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'profiles'>('expenses');
  
  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<ExpenseAccountProfile[]>([]);
  
  // Modals & Forms
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileFilter, setSelectedProfileFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Form: Payee / Account Profile
  const [profileForm, setProfileForm] = useState<Partial<ExpenseAccountProfile>>({
    accountName: '',
    category: 'Factory Sourcing',
    accountType: 'Vendor/Supplier',
    contactPerson: '',
    phone: '',
    email: '',
    paymentDetails: ''
  });

  // Form: Daily Expense Item
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    paidBy: '', // Payee / Beneficiary Profile Name ("For whom")
    category: 'Re-Processing',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    allocationField: '' // Operational Field / Shipment reference
  });

  // Listen to Firestore
  useEffect(() => {
    if (!db) return;

    // Fetch Daily Expenses
    const qExpenses = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense));
      setExpenses(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    // Fetch Payee Account Profiles
    const qProfiles = query(collection(db, 'expenseAccounts'), orderBy('accountName', 'asc'));
    const unsubProfiles = onSnapshot(qProfiles, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpenseAccountProfile));
      setProfiles(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenseAccounts');
    });

    return () => {
      unsubExpenses();
      unsubProfiles();
    };
  }, []);

  // Save new Payee Account Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profileForm.accountName) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'expenseAccounts'), {
        ...profileForm,
        createdAt: new Date().toISOString()
      });
      setIsProfileModalOpen(false);
      setProfileForm({
        accountName: '',
        category: 'Factory Sourcing',
        accountType: 'Vendor/Supplier',
        contactPerson: '',
        phone: '',
        email: '',
        paymentDetails: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'expenseAccounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Daily Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !expenseForm.title || !expenseForm.amount) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        title: expenseForm.title,
        paidBy: expenseForm.paidBy || 'General Account',
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.allocationField 
          ? `[Field: ${expenseForm.allocationField}] ${expenseForm.description}` 
          : expenseForm.description,
        createdAt: new Date().toISOString()
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        paidBy: '',
        category: 'Re-Processing',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        allocationField: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'expenses');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    if (!db || !window.confirm('Erase this expense record permanently?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  // Delete account profile
  const handleDeleteProfile = async (id: string) => {
    if (!db || !window.confirm('Delete this expense account profile?')) return;
    try {
      await deleteDoc(doc(db, 'expenseAccounts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenseAccounts/${id}`);
    }
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.paidBy && e.paidBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProfile = selectedProfileFilter === 'All' || e.paidBy === selectedProfileFilter;
    const matchesCategory = selectedCategoryFilter === 'All' || e.category === selectedCategoryFilter;
    return matchesSearch && matchesProfile && matchesCategory;
  });

  // Calculate totals
  const totalExpensesSum = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-red-500 shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daily Expenses & Account Profiles</h2>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Track daily field expenditures and beneficiary payee profiles ("for whom money is spent").</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-800 hover:text-red-600 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <UserCheck className="w-4 h-4 text-red-600" /> Create Payee Profile
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-slate-900 hover:bg-red-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Log Daily Expense
          </button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Expenses Incurred</p>
            <p className="text-3xl font-black text-slate-900 mt-2">${totalExpensesSum.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1">{expenses.length} Records Logged</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 font-black">
            $
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Payee Account Profiles</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{profiles.length}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1">Vendors, Staff & Authorities</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Expenditure Field</p>
            <p className="text-xl font-black text-slate-900 mt-2 truncate max-w-[200px]">
              {expenses.length > 0 ? expenses[0].category : 'Re-Processing'}
            </p>
            <p className="text-[10px] font-bold text-emerald-600 mt-1">Sourcing & Customs Clearance</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Daily Expenses Log ({filteredExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'profiles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Payee Account Profiles ({profiles.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search expenses or payee..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>

          {/* Payee Profile Filter */}
          {activeTab === 'expenses' && (
            <select
              value={selectedProfileFilter}
              onChange={e => setSelectedProfileFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Payees ("For Whom")</option>
              {profiles.map(p => (
                <option key={p.id} value={p.accountName}>{p.accountName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: DAILY EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <th className="p-5">Title & Field Details</th>
                <th className="p-5">Payee Account ("For Whom Spent")</th>
                <th className="p-5">Category</th>
                <th className="p-5">Date</th>
                <th className="p-5 text-right">Amount</th>
                <th className="p-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <p className="font-black text-slate-900">{e.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{e.description || 'No notes provided'}</p>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        <UserCheck className="w-3 h-3" /> {e.paidBy || 'General Account'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500 font-mono text-[11px]">{e.date}</td>
                    <td className="p-5 text-right text-base font-black text-slate-900">
                      ${(e.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => handleDeleteExpense(e.id!)}
                        className="p-2 text-slate-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                    No expense entries recorded for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: PAYEE ACCOUNT PROFILES LIST */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.length > 0 ? (
            profiles.map(p => {
              // Calculate cumulative expenses for this profile
              const spentForProfile = expenses
                .filter(e => e.paidBy === p.accountName)
                .reduce((acc, curr) => acc + (curr.amount || 0), 0);

              return (
                <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-base">
                        {p.accountName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase">{p.accountName}</h4>
                        <span className="text-[9px] font-black uppercase text-red-600 tracking-wider bg-red-50 px-2 py-0.5 rounded">
                          {p.accountType}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProfile(p.id!)}
                      className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-600">
                    {p.contactPerson && <p><strong className="text-slate-900">Contact:</strong> {p.contactPerson}</p>}
                    {p.phone && <p><strong className="text-slate-900">Phone:</strong> {p.phone}</p>}
                    {p.paymentDetails && <p><strong className="text-slate-900">Pay Info:</strong> {p.paymentDetails}</p>}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Spent For Payee</span>
                    <span className="text-sm font-black text-slate-900">${spentForProfile.toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-100 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-black text-slate-900 uppercase">No Payee Account Profiles Created Yet</h4>
              <p className="text-xs text-slate-500 mt-1">Create beneficiary profiles for vendors, factories, freight agents, or staff to track for whom money is spent.</p>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE PAYEE ACCOUNT PROFILE */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-[2.5rem] p-8 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-black text-lg"
            >
              ×
            </button>

            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Create Payee Account Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Payee / Account Name ("For Whom Money is Spent")</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Apex Textile Mills / Chittagong Customs / Supervisor Rahim"
                  value={profileForm.accountName}
                  onChange={e => setProfileForm({ ...profileForm, accountName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Account Category</label>
                  <select
                    value={profileForm.category}
                    onChange={e => setProfileForm({ ...profileForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-xs text-slate-800"
                  >
                    <option value="Factory Sourcing">Factory Sourcing</option>
                    <option value="Re-Processing">Re-Processing & Tagging</option>
                    <option value="Customs & Duty">Customs & Duty</option>
                    <option value="Freight & Logistics">Freight & Logistics</option>
                    <option value="Staff Allowance">Staff & Daily Allowance</option>
                    <option value="Utilities">Utilities & Office</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Account Type</label>
                  <select
                    value={profileForm.accountType}
                    onChange={e => setProfileForm({ ...profileForm, accountType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-xs text-slate-800"
                  >
                    <option value="Vendor/Supplier">Vendor / Factory</option>
                    <option value="Logistics & Customs">Logistics & Customs</option>
                    <option value="Employee/Staff">Employee / Staff</option>
                    <option value="Government/Duty">Government Authority</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Contact Person & Phone</label>
                <input
                  type="text"
                  placeholder="Name / Phone number"
                  value={profileForm.contactPerson}
                  onChange={e => setProfileForm({ ...profileForm, contactPerson: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Payment / Bank / bKash Info</label>
                <input
                  type="text"
                  placeholder="e.g. Dutch Bangla Bank A/C #123456 or bKash 017..."
                  value={profileForm.paymentDetails}
                  onChange={e => setProfileForm({ ...profileForm, paymentDetails: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-xs text-slate-800"
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-red-600 transition-all shadow-xl"
              >
                {isLoading ? 'Saving...' : 'Register Payee Account Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG DAILY EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-[2.5rem] p-8 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-black text-lg"
            >
              ×
            </button>

            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Record Daily Expenditure</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Expense Title / Description</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Re-tagging labor charges / Freight advance payment"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Payee Account ("For Whom Spent")</label>
                  <select
                    value={expenseForm.paidBy}
                    onChange={e => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-xs text-slate-800"
                  >
                    <option value="">-- Select Payee Profile --</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.accountName}>{p.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Operational Field / Shipment</label>
                  <input
                    type="text"
                    placeholder="e.g. Invoice #RBI-8492"
                    value={expenseForm.allocationField}
                    onChange={e => setExpenseForm({ ...expenseForm, allocationField: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 font-bold text-xs text-slate-800"
                  >
                    <option value="Re-Processing">Re-Processing</option>
                    <option value="Factory Sourcing">Factory Sourcing</option>
                    <option value="Customs & Clearance">Customs & Clearance</option>
                    <option value="Freight & Logistics">Freight & Logistics</option>
                    <option value="Staff Allowance">Staff Allowance</option>
                    <option value="Utilities & Rent">Utilities & Rent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Amount ($ USD)</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 font-black text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 font-bold text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Voucher or invoice reference details..."
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-xs text-slate-800"
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-slate-900 transition-all shadow-xl"
              >
                {isLoading ? 'Recording...' : 'Log Expense Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseAccountsModule;
