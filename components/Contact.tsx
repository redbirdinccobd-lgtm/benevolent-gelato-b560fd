
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_ADDRESS } from '../constants';

interface FormData {
  name: string;
  company: string;
  email: string;
  category: string;
  message: string;
}

interface FormErrors {
  name?: string;
  company?: string;
  email?: string;
  message?: string;
}

const Contact: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    email: '',
    category: 'T-shirts',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message cannot be empty';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (!db) {
        console.error('Firebase Firestore is not initialized. Please check your environment variables.');
        alert('The contact form is currently unavailable. Please try again later or contact us directly via email.');
        return;
      }

      setIsSubmitting(true);
      try {
        await addDoc(collection(db, 'inquiries'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        setIsSubmitted(true);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'inquiries');
        alert('There was an error submitting your inquiry. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          <div className="lg:w-1/3 bg-red-600 p-12 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-6">Contact Details</h3>
              <p className="text-red-100 mb-8">Ready to expand your inventory? Get in touch with our sourcing team today.</p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-red-100 uppercase font-bold">Email Us</p>
                    <p className="font-medium">{COMPANY_EMAIL}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-red-100 uppercase font-bold">Call Us</p>
                    <p className="font-medium">{COMPANY_PHONE}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-red-100 uppercase font-bold">Visit Us</p>
                    <p className="font-medium">{COMPANY_ADDRESS}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-12">
               <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white/30 transition-colors"><img className="w-5 h-5 invert" src="https://www.svgrepo.com/show/512317/facebook-176.svg" alt="FB" /></a>
               <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white/30 transition-colors"><img className="w-5 h-5 invert" src="https://www.svgrepo.com/show/506511/linkedin.svg" alt="LI" /></a>
               <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white/30 transition-colors"><img className="w-5 h-5 invert" src="https://www.svgrepo.com/show/512399/instagram-167.svg" alt="IG" /></a>
            </div>
          </div>
          
          <div className="lg:w-2/3 p-12 bg-white flex flex-col justify-center">
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-green-50 rounded-2xl border border-green-100"
              >
                <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Success!</h3>
                <h4 className="text-xl font-bold text-green-700 mb-6">Inquiry Received & Processed</h4>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-green-200/50">
                  <p className="text-slate-700 leading-relaxed">
                    Thank you for reaching out, <span className="font-bold text-slate-900">{formData.name.split(' ')[0]}</span>. 
                    Your inquiry for <span className="font-bold text-red-600">{formData.category}</span> has been logged in our systems. 
                    Our sourcing team is now reviewing your requirements and will provide a detailed quotation via <span className="font-bold">{formData.email}</span> within 24 hours.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', company: '', email: '', category: 'T-shirts', message: '' });
                  }}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  New Inquiry
                </button>
              </motion.div>
            ) : (
              <>
                <h3 className="text-3xl font-bold text-slate-900 mb-8">Send an Inquiry</h3>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit} noValidate>
                   <div className="flex flex-col">
                      <label className="text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe" 
                        className={`bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-lg p-3 focus:outline-none focus:border-red-500 transition-colors`} 
                      />
                      {errors.name && <span className="text-red-500 text-xs mt-1 font-medium">{errors.name}</span>}
                   </div>
                   <div className="flex flex-col">
                      <label className="text-sm font-bold text-slate-700 mb-2">Company Name</label>
                      <input 
                        type="text" 
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Fashion Retail Ltd." 
                        className={`bg-slate-50 border ${errors.company ? 'border-red-500' : 'border-slate-200'} rounded-lg p-3 focus:outline-none focus:border-red-500 transition-colors`} 
                      />
                      {errors.company && <span className="text-red-500 text-xs mt-1 font-medium">{errors.company}</span>}
                   </div>
                   <div className="flex flex-col">
                      <label className="text-sm font-bold text-slate-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@company.com" 
                        className={`bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg p-3 focus:outline-none focus:border-red-500 transition-colors`} 
                      />
                      {errors.email && <span className="text-red-500 text-xs mt-1 font-medium">{errors.email}</span>}
                   </div>
                   <div className="flex flex-col">
                      <label className="text-sm font-bold text-slate-700 mb-2">Interest Category</label>
                      <select 
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-red-500 transition-colors"
                      >
                         <option value="T-shirts">T-shirts</option>
                         <option value="Jeans">Jeans</option>
                         <option value="Activewear">Activewear</option>
                         <option value="Outerwear">Outerwear</option>
                         <option value="Formal Wear">Formal Wear</option>
                         <option value="Undergarments">Undergarments</option>
                         <option value="Custom Orders">Custom Orders</option>
                      </select>
                   </div>
                   <div className="flex flex-col md:col-span-2">
                      <label className="text-sm font-bold text-slate-700 mb-2">Message</label>
                      <textarea 
                        name="message"
                        rows={4} 
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="I am looking for bulk stock for Calvin Klein jeans..." 
                        className={`bg-slate-50 border ${errors.message ? 'border-red-500' : 'border-slate-200'} rounded-lg p-3 focus:outline-none focus:border-red-500 transition-colors`}
                      ></textarea>
                      {errors.message && <span className="text-red-500 text-xs mt-1 font-medium">{errors.message}</span>}
                   </div>
                   <div className="md:col-span-2">
                      <button 
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : 'Submit Inquiry'}
                      </button>
                   </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
