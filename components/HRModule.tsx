import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Camera, CreditCard, FileText, Search, Download, Trash2, Printer, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Employee } from '../types';

const HRModule: React.FC = () => {
  const [view, setView] = useState<'list' | 'add' | 'id-card' | 'letter'>('list');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const idCardRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    designation: '',
    department: '',
    joiningDate: new Date().toISOString().split('T')[0],
    phone: '',
    email: '',
    bloodGroup: '',
    nidPassport: '',
    address: '',
    emergencyContact: '',
    salary: 0,
    photo: null
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ ...doc.data(), employeeId: doc.id } as Employee));
      setEmployees(emps);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'employees');
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsLoading(true);
    try {
      const employeeData = {
        ...formData,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'employees'), employeeData);
      setView('list');
      setFormData({
        name: '',
        designation: '',
        department: '',
        joiningDate: new Date().toISOString().split('T')[0],
        phone: '',
        email: '',
        bloodGroup: '',
        nidPassport: '',
        address: '',
        emergencyContact: '',
        salary: 0,
        photo: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'employees');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!db || !window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  };

  const exportPDF = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    try {
      // Ensure images are loaded
      const images = Array.from(ref.current.getElementsByTagName('img')) as HTMLImageElement[];
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);

      const canvas = await html2canvas(ref.current, { scale: 3, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      if (imgData === 'data:,') throw new Error("Canvas content is empty");
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const IDCard = ({ employee }: { employee: Employee }) => (
    <div className="flex flex-col items-center gap-8 p-12 bg-slate-100 rounded-3xl">
      <div 
        ref={idCardRef}
        className="w-[320px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-200"
      >
        {/* Header Decor */}
        <div className="h-32 bg-slate-900 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-bl-full"></div>
          <div className="absolute top-8 left-0 right-0 flex flex-col items-center">
            <h2 className="text-white font-black tracking-tighter text-lg uppercase">RED BIRD</h2>
            <p className="text-[8px] text-red-500 font-black uppercase tracking-[0.3em]">International Intelligence</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="relative -mt-16 flex flex-col items-center px-8 text-center">
          <div className="w-32 h-32 bg-white rounded-full p-1 shadow-xl relative z-10">
            {employee.photo ? (
              <img src={employee.photo} alt={employee.name} className="w-full h-full rounded-full object-cover border-4 border-slate-900" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-900">
                <Camera className="text-slate-400" size={32} />
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="text-xl font-black text-slate-900 leading-tight uppercase">{employee.name}</h3>
            <p className="text-xs font-black text-red-600 uppercase tracking-widest mt-1">{employee.designation}</p>
          </div>

          <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-100">
             <div className="flex justify-between text-[10px]">
                <span className="font-black text-slate-400 uppercase">Employee ID</span>
                <span className="font-black text-slate-900">{employee.employeeId.slice(-6).toUpperCase()}</span>
             </div>
             <div className="flex justify-between text-[10px]">
                <span className="font-black text-slate-400 uppercase">Department</span>
                <span className="font-black text-slate-900">{employee.department}</span>
             </div>
             <div className="flex justify-between text-[10px]">
                <span className="font-black text-slate-400 uppercase">Joined</span>
                <span className="font-black text-slate-900">{employee.joiningDate}</span>
             </div>
             <div className="flex justify-between text-[10px]">
                <span className="font-black text-slate-400 uppercase">Blood Group</span>
                <span className="font-black text-red-600">{employee.bloodGroup}</span>
             </div>
          </div>

          <div className="mt-8">
             <QRCodeSVG 
                value={`REDBIRD-EMP-${employee.employeeId}`} 
                size={70} 
                level="H" 
                includeMargin={false}
                className="opacity-80"
             />
             <p className="text-[7px] font-black text-slate-400 uppercase mt-2 tracking-widest">Scan for Verification</p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full h-2 bg-red-600"></div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => exportPDF(idCardRef, `${employee.name}_ID_Card.pdf`)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all"
        >
          <Download size={18} />
          Download ID Card
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all"
        >
          <Printer size={18} />
          Print
        </button>
      </div>
    </div>
  );

  const AppointmentLetter = ({ employee }: { employee: Employee }) => (
    <div className="flex flex-col items-center gap-8 p-12 bg-slate-100 rounded-3xl">
      <div 
        ref={letterRef}
        className="w-[210mm] min-h-[297mm] bg-white p-[25mm] shadow-2xl relative text-slate-800 font-serif leading-relaxed"
      >
        {/* Letterhead */}
        <div className="flex justify-between items-center mb-16 pb-8 border-b-2 border-slate-100">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-sans">RED BIRD INTERNATIONAL</h2>
              <p className="text-xs text-slate-500 font-sans tracking-widest uppercase">Global Export & Logistics Intelligence</p>
           </div>
           <div className="text-right text-[10px] font-sans text-slate-500 uppercase leading-relaxed">
              <p>Plot-100, Majar Chow Road</p>
              <p>Uttarkhan, Dhaka-1230</p>
              <p>www.redbird-international.com</p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="text-right font-sans text-sm mb-12">
              <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-slate-500">Ref: RBI/HR/AL/{employee.employeeId.slice(-4).toUpperCase()}</p>
           </div>

           <div>
              <p className="font-bold">{employee.name}</p>
              <p>{employee.address}</p>
              <p>Phone: {employee.phone}</p>
           </div>

           <h1 className="text-xl font-bold text-center underline uppercase my-12 font-sans tracking-wide">Letter of Appointment</h1>

           <p>Dear Mr./Ms. {employee.name.split(' ')[0]},</p>

           <p>We are pleased to appoint you as <strong>{employee.designation}</strong> in the <strong>{employee.department}</strong> department of <strong>Red Bird International</strong>, effective from <strong>{employee.joiningDate}</strong>.</p>

           <div className="space-y-4">
              <h3 className="font-bold uppercase text-sm font-sans mb-2">1. Remuneration</h3>
              <p>Your gross monthly salary will be <strong>BDT {employee.salary?.toLocaleString()}</strong> per month, subject to applicable tax deductions as per Bangladesh government regulations.</p>

              <h3 className="font-bold uppercase text-sm font-sans mb-2">2. Probation Period</h3>
              <p>You will be on probation for a period of six months. Upon successful completion of your probation, your employment may be confirmed in writing.</p>

              <h3 className="font-bold uppercase text-sm font-sans mb-2">3. Responsibilities</h3>
              <p>Your duties and responsibilities will be as discussed and as assigned by your reporting manager from time to time.</p>
           </div>

           <div className="pt-24 flex justify-between">
              <div className="w-48 text-center border-t border-slate-900 pt-2 font-sans">
                 <p className="font-bold text-xs">Authorized Signature</p>
                 <p className="text-[10px] text-slate-500 uppercase">Red Bird International</p>
              </div>
              <div className="w-48 text-center border-t border-slate-900 pt-2 font-sans">
                 <p className="font-bold text-xs">{employee.name}</p>
                 <p className="text-[10px] text-slate-500 uppercase">Employee Acceptance</p>
              </div>
           </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 text-center text-[10px] text-slate-400 font-sans uppercase tracking-[0.2em]">
           This is a system generated document valid without manual signature
        </div>
      </div>

      <button 
        onClick={() => exportPDF(letterRef, `${employee.name}_Appointment_Letter.pdf`)}
        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
      >
        <FileText size={20} />
        Download Appointment Letter
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">HR & Payroll</h2>
          <p className="text-slate-500 font-medium">Manage Red Bird family and generate identity documents.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setView('list')}
            className={`px-6 py-3 rounded-2xl font-black transition-all ${view === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
          >
            Employee List
          </button>
          <button 
            onClick={() => setView('add')}
            className={`px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 ${view === 'add' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, ID, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-[2rem] pl-12 pr-6 py-4 text-sm font-medium focus:ring-4 focus:ring-red-600/10 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(emp => (
                <div key={emp.employeeId} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 overflow-hidden relative border border-slate-100">
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserPlus className="text-slate-300" size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 uppercase truncate">{emp.name}</h3>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{emp.designation}</p>
                      <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest leading-none">{emp.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <button 
                      onClick={() => { setSelectedEmployee(emp); setView('id-card'); }}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <CreditCard size={14} /> ID Card
                    </button>
                    <button 
                      onClick={() => { setSelectedEmployee(emp); setView('letter'); }}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <FileText size={14} /> Letter
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <QRCodeSVG value={`RBI-EMP-${emp.employeeId}`} size={24} />
                      <span className="text-[10px] font-black text-slate-300 uppercase">RBI-{emp.employeeId.slice(-4).toUpperCase()}</span>
                    </div>
                    <button 
                      onClick={() => deleteEmployee(emp.employeeId)}
                      className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'add' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Photo Upload */}
                <div className="md:col-span-2 flex items-center gap-8 bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-32 h-32 rounded-3xl bg-white border border-slate-200 overflow-hidden flex-shrink-0">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="text-slate-300" size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Employee Photo</h3>
                    <p className="text-xs text-slate-500 mb-4">Professional headshot recommended. Min 400x400px.</p>
                    <label className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-red-600 transition-colors">
                      Upload Image
                      <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designation</label>
                    <input 
                      type="text" required
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                      placeholder="e.g. Senior Merchandiser"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                    <select 
                      required
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                    >
                      <option value="">Select Department</option>
                      <option value="Management">Management</option>
                      <option value="Production">Production</option>
                      <option value="Merchandising">Merchandising</option>
                      <option value="Quality Control">Quality Control</option>
                      <option value="IT & Tech">IT & Tech</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Joining Date</label>
                    <input 
                      type="date" required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <input 
                      type="tel" required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Blood Group</label>
                      <input 
                        type="text"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                        className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                        placeholder="A+"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Monthly Salary</label>
                      <input 
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-red-600/10 transition-all font-medium"
                        placeholder="BDT"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-10 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setView('list')}
                  className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {view === 'id-card' && selectedEmployee && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="mb-8 flex items-center gap-4">
               <button onClick={() => setView('list')} className="text-slate-400 hover:text-red-600 transition-colors font-black uppercase text-xs">← Back to List</button>
               <h3 className="text-xl font-black text-slate-900 uppercase">Generating ID Card for {selectedEmployee.name}</h3>
            </div>
            <IDCard employee={selectedEmployee} />
          </motion.div>
        )}

        {view === 'letter' && selectedEmployee && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="mb-8 flex items-center gap-4">
               <button onClick={() => setView('list')} className="text-slate-400 hover:text-red-600 transition-colors font-black uppercase text-xs">← Back to List</button>
               <h3 className="text-xl font-black text-slate-900 uppercase">Generating Appointment Letter for {selectedEmployee.name}</h3>
            </div>
            <AppointmentLetter employee={selectedEmployee} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HRModule;
