
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, UserCheck, Plane, Building, Download, Mail, Globe, Hash, Calendar, ShieldCheck, MapPin, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { VisaInvitation, AccommodationStatement } from '../types';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

const VisaInvitationModule: React.FC = () => {
  const [activeView, setActiveView] = useState<'invitation' | 'accommodation' | 'list'>('invitation');
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // States
  const [invitationData, setInvitationData] = useState<Partial<VisaInvitation>>({
    buyerName: '',
    passportNumber: '',
    nationality: '',
    arrivalDate: '',
    airport: 'Hazrat Shahjalal International Airport, Dhaka',
    content: ''
  });

  const [accommodationData, setAccommodationData] = useState<Partial<AccommodationStatement>>({
    buyerName: '',
    hotelName: 'Red Bird Guest House / Partner Hotel',
    stayFrom: '',
    stayTo: '',
    content: ''
  });

  const [isAccommodationProvided, setIsAccommodationProvided] = useState(false);

  // Templates
  const updateInvitationTemplate = () => {
    const text = `To,
The Immigration Officer,
Hazrat Shahjalal International Airport, Dhaka.

Subject: Request for Business Visa on Arrival (VOA) Support.

Dear Sir,

We, Red Bird International, a leading apparel export and sourcing house in Bangladesh, are pleased to invite Mr./Ms. ${invitationData.buyerName || '[Name]'}, holder of ${invitationData.nationality || '[Nationality]'} Passport No: ${invitationData.passportNumber || '[No]'}, to visit our facilities for business development and quality assessment of current production orders.

He/She is scheduled to arrive at Hazrat Shahjalal International Airport, Dhaka on ${invitationData.arrivalDate || '[Date]'}.

The purpose of this visit is strictly business-related, including visiting our factories, finalizing sampling for the upcoming season, and discussing global export strategies. 

${isAccommodationProvided 
  ? "Red Bird International will provide full accommodation at our corporate guest house and will manage all local logistics and security for the duration of the stay." 
  : "The guest will stay at a pre-booked hotel, and Red Bird International will facilitate all local transportation and business meetings."}

We request your kind cooperation in granting the visitor a Business Visa on Arrival to facilitate this international trade mission.

Should you require any further verification, please contact our corporate office at +880-965-818-2256.

Best Regards,

Managing Director
Red Bird International`;
    setInvitationData(prev => ({ ...prev, content: text }));
  };

  const updateAccommodationTemplate = () => {
    const text = `Subject: OFFICIAL ACCOMMODATION & LOGISTICS STATEMENT

TO WHOM IT MAY CONCERN,

This is to certify and confirm that Mr./Ms. ${accommodationData.buyerName || '[Buyer Name]'} from ${invitationData.nationality || '[Country]'} during his/her business visit to Bangladesh from ${accommodationData.stayFrom || '[Start Date]'} to ${accommodationData.stayTo || '[End Date]'} will be hosted by Red Bird International.

Red Bird International will ensure high-security lodging at ${accommodationData.hotelName || '[Hotel/Guest House]'}. 

Furthermore, our specialized logistics team will provide:
1. VIP Airport Reception & Handover.
2. 24/7 Dedicated Transportation.
3. Guided Factory Visits and Sourcing Hub Tours.
4. Professional Translation & Business Concierge Services.

This statement is issued to facilitate smooth immigration and local administrative requirements during the visitor's tenure with us.

Best Regards,

Operations Directorate
Red Bird International`;
    setAccommodationData(prev => ({ ...prev, content: text }));
  };

  useEffect(() => {
    updateInvitationTemplate();
  }, [invitationData.buyerName, invitationData.passportNumber, invitationData.nationality, invitationData.arrivalDate, isAccommodationProvided]);

  useEffect(() => {
    updateAccommodationTemplate();
  }, [accommodationData.buyerName, accommodationData.hotelName, accommodationData.stayFrom, accommodationData.stayTo, invitationData.nationality]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      const collectionName = activeView === 'invitation' ? 'visa_invitations' : 'accommodation_statements';
      const data = activeView === 'invitation' ? invitationData : accommodationData;
      await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      alert('Document generated and archived successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'visa');
    }
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      // Ensure images are loaded
      const images = Array.from(printRef.current.getElementsByTagName('img')) as HTMLImageElement[];
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);

      const canvas = await html2canvas(printRef.current, { 
        scale: 3, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      if (imgData === 'data:,') throw new Error("Document content capture failed");
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RBI_${activeView.toUpperCase()}_${(activeView === 'invitation' ? invitationData.buyerName : accommodationData.buyerName) || 'DOC'}.pdf`);
    } catch (e) {
      console.error("PDF Export Error:", e);
      alert(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Immigration & Logistics</h2>
          <p className="text-slate-500 font-medium tracking-tight">Generate official Visa On-Arrival Invitations and Accommodation Letters.</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setActiveView('invitation')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'invitation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Invitation
          </button>
          <button 
            onClick={() => setActiveView('accommodation')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'accommodation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Accommodation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Column */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
             <form onSubmit={handleSubmit} className="space-y-8">
                {activeView === 'invitation' ? (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Buyer Full Name</label>
                            <input 
                               type="text" required
                               value={invitationData.buyerName}
                               onChange={e => setInvitationData({...invitationData, buyerName: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                               placeholder="e.g. Kim Min-su"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Passport Number</label>
                            <input 
                               type="text" required
                               value={invitationData.passportNumber}
                               onChange={e => setInvitationData({...invitationData, passportNumber: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                               placeholder="M1234567"
                            />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nationality</label>
                            <input 
                               type="text" required
                               value={invitationData.nationality}
                               onChange={e => setInvitationData({...invitationData, nationality: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                               placeholder="e.g. South Korean"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Arrival Date</label>
                            <input 
                               type="date" required
                               value={invitationData.arrivalDate}
                               onChange={e => setInvitationData({...invitationData, arrivalDate: e.target.value})}
                               className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                            />
                         </div>
                      </div>

                      <div className="bg-red-600/5 p-6 rounded-3xl border border-red-600/10 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600">
                               <Building size={20} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase">Provider Accommodation</p>
                               <p className="text-[10px] text-slate-500 font-medium">Add official hosting statement to letter.</p>
                            </div>
                         </div>
                         <button 
                           type="button"
                           onClick={() => setIsAccommodationProvided(!isAccommodationProvided)}
                           className={`w-12 h-6 rounded-full relative transition-all ${isAccommodationProvided ? 'bg-red-600' : 'bg-slate-200'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAccommodationProvided ? 'right-1' : 'left-1'}`}></div>
                         </button>
                      </div>
                   </div>
                ) : (
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Buyer Name</label>
                        <input 
                           type="text" required
                           value={accommodationData.buyerName}
                           onChange={e => {
                              setAccommodationData({...accommodationData, buyerName: e.target.value});
                              setInvitationData({...invitationData, buyerName: e.target.value});
                           }}
                           className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                           placeholder="Full Name"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Accommodation Venue</label>
                        <input 
                           type="text" required
                           value={accommodationData.hotelName}
                           onChange={e => setAccommodationData({...accommodationData, hotelName: e.target.value})}
                           className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                           placeholder="e.g. Radisson Blu or Guest House"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stay From</label>
                           <input 
                              type="date" required
                              value={accommodationData.stayFrom}
                              onChange={e => setAccommodationData({...accommodationData, stayFrom: e.target.value})}
                              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stay To</label>
                           <input 
                              type="date" required
                              value={accommodationData.stayTo}
                              onChange={e => setAccommodationData({...accommodationData, stayTo: e.target.value})}
                              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold"
                           />
                        </div>
                     </div>
                  </div>
                )}

                <div className="pt-6">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1 flex justify-between items-center">
                      <span>Document Preview & Editing</span>
                      <span className="text-red-600 lowercase font-medium">Read-only template autofill</span>
                   </label>
                   <textarea 
                     readOnly
                     rows={12}
                     value={activeView === 'invitation' ? invitationData.content : accommodationData.content}
                     className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] p-8 text-sm font-serif leading-relaxed text-slate-600 focus:outline-none"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6">
                   <button 
                     type="submit"
                     className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                      Save to Archive
                   </button>
                   <button 
                     type="button"
                     disabled={isGenerating}
                     onClick={exportPDF}
                     className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {isGenerating ? 'Processing...' : <><Download size={18} /> Download PDF</>}
                   </button>
                </div>
             </form>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="sticky top-8">
           <div className="flex items-center gap-2 mb-6 ml-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Letterhead Preview</span>
           </div>

           <div className="scale-[0.8] origin-top bg-white shadow-2xl rounded-[1rem] overflow-hidden">
              <div ref={printRef} className="w-[210mm] min-h-[297mm] bg-white p-[25mm] relative text-slate-800 font-serif leading-relaxed">
                 {/* Premium Background Decor */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[10rem] -z-0"></div>
                 
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-16 pb-8 border-b-2 border-slate-900">
                       <div className="flex flex-col">
                          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-sans leading-none mb-1">RED BIRD</h1>
                          <p className="text-[10px] font-black text-red-600 tracking-[0.4em] uppercase font-sans">International</p>
                          <div className="mt-4 text-[9px] text-slate-500 font-sans uppercase leading-tight font-medium">
                             <p>Apparel Wholesale & Global Export</p>
                             <p>Sourcing Hub Bangladesh</p>
                          </div>
                       </div>
                       <div className="text-right text-[8px] font-sans text-slate-400 font-medium space-y-1">
                          <p>Plot-100, Majar Chow Road</p>
                          <p>Uttarkhan, Dhaka-1230, BD</p>
                          <p>www.redbird-international.com</p>
                       </div>
                    </div>

                    <div className="text-right mb-12 font-sans">
                       <p className="text-sm font-bold">Ref: RBI/${activeView === 'invitation' ? 'VISA' : 'ACC'}/${new Date().getFullYear()}/${Math.floor(100+Math.random()*900)}</p>
                       <p className="text-sm font-bold">Date: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="whitespace-pre-line text-slate-900 text-sm leading-[1.8] min-h-[500px]">
                       {activeView === 'invitation' ? invitationData.content : accommodationData.content}
                    </div>

                    <div className="mt-20 pt-16 flex justify-between items-end">
                       <div className="text-center font-sans">
                          <div className="w-48 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-2 flex items-center justify-center">
                             <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Authorized Seal</span>
                          </div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">Authorized Signature</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Managing Director</p>
                       </div>

                       <div className="text-right">
                          <div className="w-16 h-16 border-2 border-red-600/20 rounded-2xl flex items-center justify-center p-2 opacity-30">
                             <ShieldCheck className="text-red-600" size={32} />
                          </div>
                          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-2">Verified Logistic Partner</p>
                       </div>
                    </div>
                 </div>

                 {/* Footer Line */}
                 <div className="absolute bottom-12 left-[25mm] right-[25mm] flex justify-between items-center text-[7px] font-black text-slate-300 uppercase tracking-widest">
                    <span>Corporate Confidential</span>
                    <span>Page 01 of 01</span>
                    <span>System Generated 2026</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VisaInvitationModule;
